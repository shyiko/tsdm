var rpt = require('read-package-tree');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var rslv = require('resolve');
var async = require('async');
var up = require('findup');
var pluck = require('lodash.pluck');
var assign = require('lodash.assign');
var rc = require('rcfg');
var fs = require('fs');
var path = require('path');
var util = require('util');
var def = Boolean;
var EventEmitter = require('events').EventEmitter;

var debug = util.debuglog('tsdm');

// todo: proxy npm commands for auto rewire?
// fixme: if scoped-declaration provider is removed - corresponding node_module
// will still contain invalid reference

/**
 * @param {string} path
 * @param {function(pkg): boolean} filter
 * @param cb {function(err, pkg[])}
 */
function list(path, filter, cb) {
  var rootNode;
  rpt(path, function (node) {
    return (rootNode || (rootNode = node)) === node;
  }, function (err, data) {
    if (err) {
      return cb(err);
    }
    var defModules = data.children
      .reduce(function (r, node) {
        var pkg = node.package;
        if (filter(pkg)) {
          // _id: '<name>@<version>'
          pkg._where = node.realpath;
          r.push(pkg);
        }
        return r;
      }, [])
      .sort(function (l, r) { return l.name.localeCompare(r.name); });
    cb(null, defModules);
  });
}

/**
 * @param {string} dir
 * @param {function(stats, path): boolean} filter
 * @param cb {function(err)}
 */
function rm(dir, filter, cb) {
  fs.readdir(dir, function (err, fileNames) {
    if (err) {
      return cb(err);
    }
    async.each(fileNames, function (fileName, cb) {
      var file = path.join(dir, fileName);
      fs.lstat(file, function (err, stats) {
        if (err) {
          return cb(err);
        }
        if (filter(stats, file)) {
          fs.unlink(file, cb);
        } else {
          cb();
        }
      });
    }, cb);
  });
}

/**
 * @param {string[]} src
 * @param {string} dst
 * @param {function(err)} cb
 */
function link(src, dst, cb) {
  async.each(src, function (src, cb) {
    fs.symlink(src, path.join(dst, path.basename(src)), cb);
  }, cb);
}

/**
 * @param {string} file
 * @param {string[]} refs
 * @param {function(err)} cb
 */
function commitRefs(file, refs, cb) {
  var data = [
    '// Autogenerated, do not edit. All changes will be lost.\n'
  ].concat(
    refs.map(function (ref) {
      return '/// <reference path="' + ref + '" />';
    })
  ).join('\n');
  fs.writeFile(file, data, cb);
}

function rewireAmbient(o, cb) {
  var self = this;
  list(o.path,
    function (pkg) {
      var t = pkg.typescript;
      return t && (t.definition || t.definitions);
    },
    function (err, pkgs) {
      if (err) {
        return cb(err);
      }
      var defRoot = path.join(o.path, 'typings');
      if (!pkgs.length) {
        return rimraf(defRoot, cb);
      }
      pkgs.forEach(function (pkg) {
        debug('Found ambient typings provider ' +
          path.relative(process.cwd(), pkg._where));
      });
      async.series([
        // create typings/ directory
        mkdirp.bind(null, defRoot),
        // delete previous symlinks (if any)
        rm.bind(null, defRoot, function (st) { return st.isSymbolicLink(); }),
        // create typings/* symlinks (disabled by default)
        // required in case of "excluded" node_modules/ + WebStorm 11
        o.link && link.bind(null, pluck(pkgs, '_where'), defRoot),
        // update typings/tsd.d.ts
        function (cb) {
          pkgs.forEach(function (pkg) {
            self.emit('wired', {type: 'ambient', pkg: pkg});
          });
          var refs = pkgs.reduce(function (r, pkg) {
            var def = [].concat(pkg.typescript.definition ||
              pkg.typescript.definitions);
            return r.concat(def.map(function (def) {
              return path.join(pkg.name, def);
            }));
          }, []);
          var override = path.join(o.path, '.tsdm.d.ts');
          fs.stat(override, function (err, stats) {
            if (!err && stats.isFile()) {
              refs.push(path.relative(defRoot, override));
              self.emit('wired', {type: 'ambient',
                pkg: {_where: override}});
            }
            commitRefs(path.join(defRoot, 'tsd.d.ts'), refs, cb);
          });
        }
      ].filter(def), cb);
    });
}

function rewireScoped(o, cb) {
  var self = this;
  list(o.path,
    function (pkg) { return pkg.typings && pkg.typingsScope; },
    function (err, pkgs) {
      if (err) {
        return cb(err);
      }
      pkgs.forEach(function (pkg) {
        debug('Found typings provider ' +
          path.relative(process.cwd(), pkg._where));
      });
      // resolve external type declarations
      async.map(pkgs, function (pkg, cb) {
        rslv(pkg.typingsScope, {basedir: pkg._where},
          function (err, location) {
            if (err) {
              return cb(err);
            }
            up(location, 'package.json', function (err, dir) {
              if (err) {
                return cb(err);
              }
              var base = path.relative(dir, pkg._where);
              cb(null, {
                source: path.join(pkg._where, 'package.json'),
                path: dir,
                typings: [].concat(pkg.typings).map(function (t) {
                  return path.join(base, t);
                })
              });
            });
          });
      }, function (err, pp) {
        if (err) {
          return cb(err);
        }
        // update packages with external type declarations
        async.each(pp, function (p, cb) {
          var file = path.join(p.path, 'package.json');
          fs.readFile(file, function (err, data) {
            if (err) {
              return cb(err);
            }
            var json;
            try {
              json = JSON.parse(data);
            } catch (e) {
              return cb(new Error('Failed to parse ' + file +
                ' (not a valid JSON)'));
            }
            json._tsdm || (json._tsdm = json.typings || true);
            if (p.typings.length > 1) {
              self.emit('warn', p.source + ' contains multiple typings. ' +
                'Only the first one will be wired in');
            }
            json.typings = p.typings[0];
            fs.writeFile(file, JSON.stringify(json, null, 2),
              function (err) {
                if (err) {
                  return cb(err);
                }
                self.emit('wired', {type: 'scoped', file: file});
                cb();
              });
          });
        }, cb);
      });
    });
}

module.exports = {
  rewire: function (o) {
    var ee = new EventEmitter();
    process.nextTick(function () {
      async.waterfall([
        rc.bind(null, 'tsdm', {cwd: o.path}),
        function (rc, cb) {
          ee.emit('rc', rc);
          var cfg = assign(rc, o);
          async.parallel([
            rewireAmbient.bind(ee, cfg), rewireScoped.bind(ee, cfg)
          ], cb);
        }
      ], function (err) {
        err && ee.emit('error', err);
        ee.emit('end');
      });
    });
    return ee;
  }
};
