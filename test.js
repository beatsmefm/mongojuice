var fs          = require('fs'),
    fileRegex   = /^test_.*\.js$/,
    ignoreRegex = /(^\.)|(\.js$)/,
    Mocha       = require('mocha'),
    argv        = require('optimist').argv,
    chai        = require('chai'),
    sinonChai   = require('sinon-chai'),
    reporter    = argv.r || process.env.CRATEFM_TEST_REPORTER || 'tap';

chai.use(sinonChai);

process.env.NODE_ENV = 'test';

var TestHarness = function (dir) {
  this.dir = dir;
  this.filesToTest = [];
  this.mocha = new Mocha();
  this.mocha.reporter(reporter).ui('bdd');
};

TestHarness.prototype.readDir = function (dir) {
  var files = fs.readdirSync(dir),
      that = this;
  var dirs = [];
  files.forEach(function (filename) {
    if(fileRegex.test(filename)) {
      that.filesToTest.push(dir + '/' + filename);
    } else if (!ignoreRegex.test(filename)) {
      dirs.push(dir + '/' + filename);
    }
  });
  if (dirs.length) {
    dirs.forEach(function (subdir) {
      that.readDir(subdir);
    });
  }
};

TestHarness.prototype.addFilesToMocha = function () {
  var that = this;
  this.filesToTest.forEach(function (filename) {
    that.mocha.addFile(filename);
  });
};

TestHarness.prototype.runMocha = function () {
  this.mocha.run(function(){});
};

TestHarness.prototype.run = function () {
  this.readDir(this.dir);
  this.addFilesToMocha();
  this.runMocha();
};

var tests = new TestHarness('./tests/lib');

tests.run();



