var chai               = require('chai'),
    expect             = chai.expect,
    sinon              = require('sinon'),
    sinonChai          = require('sinon-chai'),
    proxyquire         = require('proxyquire'),
    util               = require('util'),
    ParamParser        = require('../../lib/paramparser'),
    MissingParamsError = require('../../lib/errors/missingparamserror');

chai.use(sinonChai);

describe('paramparser.js', function(){
    var sandbox = sinon.sandbox.create(),
        paramParser;
    beforeEach(function(done){
        done();
    });

    afterEach(function (done) {
      sandbox.restore();
      done();
    });


    describe('#parse', function(){
        it('should return a query when just a simple :field expr', function(done){
            var args = new ParamParser(':field1', {
                field1: 'somefield1'
            }).parse();

            expect(args).to.equal('somefield1');
            done();
        });

        it('should return a parsed object when having nested expressions', function(done){
            var args = new ParamParser({
                findOne: {
                    _id: ':id',
                    field1: ':field1',
                    field2: {
                        $in: ':ids'
                    }
                }
            }, {
                id: 'someid',
                field1: 'somefield1',
                ids: [4, 5, 6]
            }).parse();
            expect(args).to.deep.equal({
                findOne: {
                    _id: 'someid',
                    field1: 'somefield1',
                    field2: {
                        $in: [4, 5, 6]
                    }
                }
            });
            done();
        });

        it('should return a query that doesnt include the params that are not passed in', function(done){
            var args = new ParamParser({
                findOne: {
                    _id: ':id',
                    field1: ':field1',
                    field2: {
                        $in: ':ids'
                    }
                }
            }, {
                id: 'someid',
                ids: [4, 5, 6]
            }).parse();

            expect(args).to.deep.equal({
                findOne: {
                    _id: 'someid',
                    field2: {
                        $in: [4, 5, 6]
                    }
                }
            });
            done();
        });

        it('should return args with empty query', function(done){
            var args = new ParamParser({
                findOne: {
                    id: ':missingparam'
                }
            }, {
                id: 'someid',
                ids: [4, 5, 6]
            }).parse();

            expect(args).to.deep.equal({
                findOne: {}
            });
            done();
        });

        it('should return evaluate nested object', function(done){
            var args = new ParamParser({
                id: '@thing.id'
            }, {
                thing: {
                    id: 'someid'
                }
            }).parse();

            expect(args).to.deep.equal({
                id: 'someid'
            });
            done();
        });

        it('should return evaluate deep nested object (3 levels)', function(done){
            var args = new ParamParser({
                id: '@thing.subobj.subobj2.subobj3.id'
            }, {
                thing: {
                    subobj: {
                        subobj2: {
                            subobj3: {
                                id: 'someid'
                            }
                        }
                    }
                }
            }).parse();

            expect(args).to.eql({
                id: 'someid'
            });
            done();
        });

        it('should map results to an array', function(done){
            var args = new ParamParser({
                ids: '$map(@things, id)',
                id: '@thing.id'
            }, {
                thing: {
                    id: 'baseid'
                },
                things: [
                    { id: 'someid1' },
                    { id: 'someid2' },
                    { id: 'someid3' },
                    { id: 'someid4' }
                ]
            }).parse();

            expect(args).to.deep.equal({
                id: 'baseid',
                ids: ['someid1', 'someid2', 'someid3', 'someid4']
            });
            done();
        });

        it('should map results to an array as the first argument and parse the inner values', function(done){
            var args = new ParamParser({
                model: 'User',
                dbcall: {
                    findOneAndUpdate: [
                        { _id: ':id' }, 
                        { $set: {
                            email: ':email'
                        }}
                    ]
                }
            }, {
                id: 'someid',
                email: 'someemail'
            }).parse();

            expect(args).to.deep.equal({
                model: 'User',
                dbcall: {
                    findOneAndUpdate: [
                        { _id: 'someid' }, 
                        { $set: {
                            email: 'someemail'
                        }}
                    ]
                }
            });
            done();
        });

    });
});