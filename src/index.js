var rpt = require('read-package-tree'); // npm/read-installed?
var mkdirp = require('mkdirp');
var Promise = require('pinkie-promise');
var fs = require('fs');
var path = require('path');

// todo: `tsdm install declaration-package --save` which updates typings/
// tsd.d.ts automatically

// todo: `prune` as an alias for `install`?

// todo: .tsdmrc for tsdm configuration

/**
 * @param path {string}
 * @param cb {function} (err, array of packages with `typescript.definition`)
 */
function list(path, cb) {
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
        if (pkg.typescript && pkg.typescript.definition) {
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
 * Removes files for which `filter` returned true.
 *
 * @param dir {string}
 * @param filter {function} (stats, path)
 * @param cb {function} (err)
 */
function rm(dir, filter, cb) {
  fs.readdir(dir, function (err, fileNames) {
    if (err) {
      return cb(err);
    }
    // fixme: do not mix promises & callbacks
    Promise.all(fileNames.map(function (fileName) {
      return new Promise(function (resolve, reject) {
        var file = path.join(dir, fileName);
        fs.lstat(file, function (err, stats) {
          if (err) {
            return reject(err);
          }
          if (filter(stats, file)) {
            fs.unlink(file, function (err) {
              if (err) {
                return reject(err);
              }
              resolve();
            });
          } else {
            resolve();
          }
        });
      });
    })).then(function () {
      process.nextTick(cb);
    }).catch(function (err) {
      process.nextTick(cb.bind(null, err));
    });
  });
}

/**
 * @param src {string|array}
 * @param dst {string}
 * @param cb {function} (err)
 */
function link(src, dst, cb) {
  Array.isArray(src) || (src = [src]);
  // fixme: do not mix promises & callbacks
  Promise.all(src.map(function (src) {
    return new Promise(function (resolve, reject) {
      var link = path.join(dst, path.basename(src));
      fs.symlink(src, link, function (err) { err ? reject(err) : resolve(); });
    });
  })).then(function () {
    process.nextTick(cb);
  }).catch(function (err) {
    process.nextTick(cb.bind(null, err));
  });
}

/**
 * @param file {string}
 * @param pkgs {array}
 * @param cb {function} (err)
 */
function commit(file, pkgs, cb) {
  var data = [
    '// Autogenerated, do not edit. All changes will be overwritten.\n'
  ].concat(
    // add "/// <reference path="<alias>/<typings_from_package>.d.ts" />"s
    pkgs.reduce(function (r, pkg) {
      var def = pkg.typescript.definition;
      typeof def === 'string' && (def = [def]);
      return r.concat(def.map(function (def) {
        return '/// <reference path="' + pkg.name + '/' + def + '" />';
      }));
    }, [])
  ).join('\n');
  fs.writeFile(file, data, function (err) {
    if (err) {
      return cb(err);
    }
    cb();
  });
}

module.exports = {
  /**
   * @param o {object}
   * @param o.path {string}
   * @param cb {function} (err, pkgs)
     */
  list: function (o, cb) {
    list(o.path, cb);
  },
  /**
   * @param o {object}
   * @param o.path {string}
   * @param cb {function} (err)
   */
  install: function (o, cb) {
    list(o.path, function (err, pkgs) {
      if (err) {
        return cb(err);
      }
      // create typings/ directory
      var defRoot = path.join(o.path, 'typings');
      mkdirp(defRoot, function (err) {
        if (err) {
          return cb(err);
        }
        // delete previous symlinks
        rm(defRoot,
          function (stats) {
            return stats.isSymbolicLink();
          },
          function (err) {
            if (err) {
              return cb(err);
            }
            // re-symlink

            // N.B. strictly speaking symlinks are unnecessary, but some
            // tools (like WebStorm 11) do not recognize declarations unless
            // DefinitelyTyped/tsd pattern is used

            link(pkgs.map(function (pkg) { return pkg._where; }), defRoot,
              function (err) {
                if (err) {
                  return cb(err);
                }
                // re-generate typings/tsd.d.ts
                commit(path.join(defRoot, 'tsd.d.ts'), pkgs, cb);
              });
          });
      });
    });
  }
};