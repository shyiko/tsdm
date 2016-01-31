var mock = require('mock-fs');
var expect = require('chai').expect;
var sinon = require('sinon');
var fs = require('fs');
var tsdm = require('../src');

describe('tsdm', function () {
  describe('#rewire()', function () {
    it('should symlink ambient definitions',
      function (cb) {
        mock({
          '/project': {
            'package.json': JSON.stringify({name: 'project', version: '0.1.0'}),
            'node_modules': {
              'a-tsd': {
                'package.json':
                  JSON.stringify({name: 'a-tsd', version: '0.1.0',
                    typescript: {definition: 'a.d.ts'}}),
                'a.d.ts': 'declare module "a" { export default 0; }'
              }
            }
          }
        });
        var spy = sinon.spy();
        tsdm.rewire({path: '/project'})
          .on('wired', spy)
          .on('error', sinon.stub().throws())
          .on('end', function () {
            expect(spy.callCount).to.be.equal(1);
            // using fs.*Sync is okay because of mock-fs binding
            var data = fs.readFileSync('/project/typings/tsd.d.ts', 'utf8');
            expect(data.split('\n'))
              .to.contain('/// <reference path="a-tsd/a.d.ts" />');
            expect(fs.lstatSync('/project/typings/a-tsd').isSymbolicLink())
              .to.be.true;
            cb();
          });
      });
    it('should rewire scoped `typings` in place',
      function (cb) {
        mock({
          '/project': {
            'package.json': JSON.stringify({name: 'project', version: '0.1.0'}),
            'node_modules': {
              'a-tsd': {
                'package.json':
                  JSON.stringify({name: 'a-tsd', version: '0.1.0',
                    typings: 'a.d.ts', typingsScope: 'a'}),
                'a.d.ts': 'export default class A { static field: string }'
              },
              'a': {
                'package.json':
                  JSON.stringify({name: 'a', version: '0.1.0'}),
                'index.js': '' // otherwise 'resolve' module will fail
              }
            }
          }
        });
        var spy = sinon.spy();
        tsdm.rewire({path: '/project'})
          .on('wired', spy)
          .on('error', sinon.stub().throws())
          .on('end', function () {
            expect(spy.callCount).to.be.equal(1);
            // using fs.*Sync is okay because of mock-fs binding
            var data = fs.readFileSync('/project/node_modules/a/package.json',
              'utf8');
            expect(JSON.parse(data).typings).to.be.equal('../a-tsd/a.d.ts');
            cb();
          });
      });
  });
  afterEach(function () {
    mock.restore();
  });
});
