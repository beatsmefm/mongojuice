var chai            = require('chai'),
    expect          = chai.expect,
    sinon           = require('sinon'),
    sinonChai       = require('sinon-chai'),
    proxyquire    = require('proxyquire'),
    util            = require('util'),
    DBCall          = require('../../lib/dbcall'),
    MissingParamsError = require('../../lib/errors/missingparamserror');

chai.use(sinonChai);


describe('dbcall.js', function() {
    var sandbox = sinon.sandbox.create(),
        dbCall;

    beforeEach(function(done){
        dbCall = new DBCall({}, {});
        done();
    });

    afterEach(function (done) {
      sandbox.restore();
      done();
    });

    describe('#findMissingParams', function(){
        it('should return a MissingParamsError', function(done){
            dbCall.config = {};
            dbCall.config.params = {
                id: {
                    required: true
                }
            };
            var error = dbCall.findMissingParams({
                'dumbfield': 'value'
            });
            expect(error).to.be.an.instanceof(MissingParamsError);
            done();
        });
        it('should return false when all params are supplied', function(done){
            dbCall.params = {
                id: {
                    required: true
                }
            };
            var error = dbCall.findMissingParams({
                'id': 'value'
            });
            expect(error).to.be.false;
            done();
        });

        it('should return a MissingParamsError', function(done){
            dbCall.config = {};
            dbCall.config.require_one = ['ids', 'tags'];
            dbCall.config.params = {
                ids: {},
                tags: {}
            }
            var error = dbCall.findMissingParams({
                'nothing': 'nothing'
            });
            expect(error).to.be.an.instanceof(MissingParamsError);
            done();
        });
    });

    

    describe('#run', function(){
        var model;
        beforeEach(function(done){
            model = {
                findOne: sandbox.spy(function(){return this}),
                find: sandbox.spy(function(){return this}),
                exec: sandbox.spy(function(){return this}),
                lean: sandbox.spy(function(){return this})
            }
            dbCall.model = model;
            done();
        });


        it('should call query functions normally', function(done){
            dbCall.config = {};
            dbCall.config.dbcall= {
                    findOne: {
                        _id: ':id',
                        field1: ':field1',
                        field2: {
                            $in: ':ids'
                        }
                    } 
                
            }
            dbCall.run({
                id: 'id',
                field1: 'field1'
            }, []);
            expect(model.findOne).to.have.been.calledOnce;
            //expect(model.lean).to.have.been.calledOnce;
            expect(model.find).to.not.been.called;
            done();
        });

        /*it('should return an error of type MissingParamsError', function(done){
            var callback = sinon.spy();
            dbCall.config = {
                params: {
                    id2: {
                        required: true
                    }
                },
                commands: {
                    findOne: {
                        _id: ':id',
                        field1: ':field1',
                        field2: {
                            $in: ':ids'
                        }
                    } 
                }   
            }
            Cache.prototype
            dbCall.run({
                id: 'id',
                field1: 'field1'
            }, [], callback);
            expect(callback).to.have.been.calledWith(/Missing:  id2/);
            done();
        });*/
    });

});