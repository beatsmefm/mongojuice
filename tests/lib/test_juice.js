var chai            = require('chai'),
    expect          = chai.expect,
    sinon           = require('sinon'),
    sinonChai       = require('sinon-chai'),
    proxyquire    = require('proxyquire'),
    util            = require('util');

chai.use(sinonChai);


describe('juice.js', function() {

    var BlenderManagerStub,
        DBManagerStub,
        Juicer,
        blenderAddConfigSpy,
        blenderIsEmptySpy,
        blenderGetDbCallsSpy,
        dbAddConfigSpy,
        dbIsEmptySpy,
        dbGetDbCallsSpy,
        sandbox = sinon.sandbox.create();

    beforeEach(function(done){

        var BlenderManager                  = function(){};
        BlenderManager.prototype.addConfig  = blenderAddConfigSpy   = sandbox.stub();
        BlenderManager.prototype.isEmpty    = blenderIsEmptySpy     = sandbox.stub();
        BlenderManager.prototype.getDbCalls = blenderGetDbCallsSpy  = sandbox.stub();
        BlenderManagerStub                  = sandbox.spy(BlenderManager);

        var DBManager                  = function(){};
        DBManager.prototype.addConfig  = dbAddConfigSpy     = sandbox.stub();
        DBManager.prototype.isEmpty    = dbIsEmptySpy       = sandbox.stub();
        DBManager.prototype.getDbCalls = dbGetDbCallsSpy    = sandbox.stub();
        DBManagerStub                  = sandbox.spy(DBManager);

        Juicer = proxyquire.resolve('../../lib/juice', __dirname, {
            './blendermanager' : BlenderManagerStub,
            './dbcallmanager': DBManagerStub
        }).Juicer;
        done();
    });

    afterEach(function (done) {
      sandbox.restore();
      done();
    });

    describe('#init', function(){

        it('should call load and init', function(done){
            var juicer = new Juicer();
            juicer.load = sandbox.spy();
            juicer.build = sandbox.spy();
            juicer.init({
                config_dir: __dirname + '/../config/valid',
                db: {}
            }, function(){
                expect(juicer.configDir).to.equal(__dirname + '/../config/valid');
                expect(juicer.load).to.have.been.calledOnce;
                expect(juicer.build).to.have.been.calledOnce;
                done();
            });

        });
    });

    describe('#blend', function(){
        it('should return error to callback', function(done) {
            done();
        });

        it('should call set cache', function(done) {
            done();
        });

        

    });

    describe('#load', function(){
        it('should error out when cant find directory', function(done){
            // var juicer = new Juicer();
            // var f = function(){
            //     // juicer.init({
            //     //     config_dir: __dirname +  '/../config/dir_doesnot_exist',
            //     //     db: {}
            //     // });
            // }
            // expect(f).to.throw(Error);
            // expect(f).to.throw(/config_dir does not exist/);
            done();
        });
    });


    describe('#blend', function(){
        it('should return blended db calls in result', function(done) {
            done();
        });

        it('should return straight db call in result', function(done){
            done();
        });

        it('should return err when there is an error', function(done){
            done();
        });

        it('should emit cache events', function(done) {
            done();
        });

        it('should set cache', function(done){
            done();
        });
    });
});




