var chai            = require('chai'),
    expect          = chai.expect,
    sinon           = require('sinon'),
    sinonChai       = require('sinon-chai'),
    proxyrequire    = require('proxyquire'),
    util            = require('util'),
    Juicer          = require('../../lib/juice').Juicer;

chai.use(sinonChai);


describe('juice.js', function() {

    describe('creating juicer', function(){
        var sandbox = sinon.sandbox.create();

        beforeEach(function(done){
            done();
        });

        afterEach(function(done){

            done();
        });

        it('should have a db and blender config file', function(done){
            var juicer = new Juicer({
                config_dir: '../../../config/valid'
            });
            done();
        });

        it('should error out when cant find directory', function(done){
            var juicer = new Juicer({
                config_dir: '../../../config/dir_doesnot_exist'
            });
            done();
        });

        it('should error out when doesnt have db config', function(done){
            var juicer = new Juicer({
                config_dir: '../../../config/missingfile'
            });
            done();
        });

        it('should error out when doesnt have db call key in blender file', function(done){
            var juicer = new Juicer({
                config_dir: '../../../config/missingdbcallkey'
            });
            done();
        });

        it('should error out when JSON doesnt load properly', function(done) {
            var juicer = new Juicer({
                config_dir: '../../../config/badjson'
            });
            done();
        });
    });
});




