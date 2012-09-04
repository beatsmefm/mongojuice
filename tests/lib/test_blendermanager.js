var chai            = require('chai'),
    expect          = chai.expect,
    sinon           = require('sinon'),
    sinonChai       = require('sinon-chai'),
    proxyquire    = require('proxyquire'),
    util            = require('util');

chai.use(sinonChai);


describe('blendermanager.js', function() {
    var sandbox = sinon.sandbox.create(),
        BlenderManager,
        BlenderStub;

    beforeEach(function(done){
        var Blender = function(){};
        BlenderStub = sandbox.spy(Blender);

        BlenderManager = proxyquire.resolve('../../lib/blendermanager', __dirname, {
            './blender' : BlenderStub
        });

        done();
    });

    afterEach(function (done) {
      sandbox.restore();
      done();
    });

    describe('#addConfig', function(){

        it('should throw an error because of duplicate key', function(done) {
            var bm = new BlenderManager({});
            bm.addConfig({
                key1: {}
            });
            var f = function(){
                bm.addConfig({
                    key1: {}
                });
            }
            expect(f).to.throw(Error);
            done();
        });

        it('should set ready to true when there is no error', function(done) {
            var bm = new BlenderManager({});
            bm.addConfig({ test1: 'test1' });
            bm.addConfig({ test2: 'test2' });
            bm.build();
            expect(bm.ready).to.be.true;
            expect(bm.isEmpty()).to.be.false;
            expect(BlenderStub).to.have.been.calledTwice;
            expect(bm.data['test1']).to.equal('test1');
            expect(bm.data['test2']).to.equal('test2');
            done();
        });
    });

});