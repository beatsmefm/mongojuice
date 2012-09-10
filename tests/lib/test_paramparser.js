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
                id: '@result.id'
            }, {
                id: 'someid'
            }).parse();

            expect(args).to.deep.equal({
                id: 'someid'
            });
            done();
        });


        it('should map results to an array', function(done){
            
            var args = new ParamParser({
                ids: '$map(@result, id)'
            }, [
                    { id: 'someid1' },
                    { id: 'someid2' },
                    { id: 'someid3' },
                    { id: 'someid4' }
                ]
            ).parse();

            expect(args).to.deep.equal({
                ids: ['someid1', 'someid2', 'someid3', 'someid4']
            });
            done();
        });

        it('should get sub value on a named @ query', function(done){
            
            var args = new ParamParser({
                ids: '@thing.ids'
            }, {
                thing: {
                    ids: [
                        'someid1',
                        'someid2',
                        'someid3',
                        'someid4' 
                    ]
                }
            }).parse();

            expect(args).to.deep.equal({
                ids: ['someid1', 'someid2', 'someid3', 'someid4']
            });
            done();
        });

        it('should map results on a named @query', function(done){
            
            var args = new ParamParser({
                ids: '$map(@thing, id)'
            }, {
                thing: [
                    { id: 'someid1'},
                     { id: 'someid2'},
                    { id: 'someid3'},
                     { id: 'someid4'},
                ]
            }).parse();

            expect(args).to.deep.equal({
                ids: ['someid1', 'someid2', 'someid3', 'someid4']
            });
            done();
        });

        it('should map results on a named @query with subfield', function(done){
            
            var args = new ParamParser({
                ids: '$map(@thing.ids, id)'
            }, {
                thing: {
                    ids: [
                    { id: 'someid1'},
                     { id: 'someid2'},
                    { id: 'someid3'},
                     { id: 'someid4'},
                    ]
                }
            }).parse(); 

            expect(args).to.deep.equal({
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

        it('should map or results', function(done){
            var args = new ParamParser({
                model: 'User',
                dbcall: {
                    find: {
                        enhanced: true,
                        isMusic: true,
                        $or: [{ 
                            _id: {
                                $in: ':link_ids'
                            }
                        }, {
                            tags: {
                                $elemMatch: {
                                    $in: ':tags'
                                }
                            }
                        }, {
                            field: ':thing.id'
                        }]
                    }
                }
            }, {
                tags: ['test'],
                link_ids: [],
                thing: {
                    id: 'someid'
                }
            }).parse();
            
            expect(args).eql({
                model: 'User',
                dbcall: {
                    find: {
                        enhanced: true,
                        isMusic: true,
                        $or: [{ 
                            _id: {
                                $in: []
                            }
                        }, {
                            tags: {
                                $elemMatch: {
                                    $in: ['test']
                                }
                            }
                        }, {
                            field: 'someid'
                        }]
                    }
                }
            });
            done();
        });
        

    });
});