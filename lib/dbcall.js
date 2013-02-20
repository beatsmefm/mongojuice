var ParamParser         = require('./paramparser'),
    MissingParamsError  = require('./errors/missingparamserror'),
    appUtils            = require('./utils'),
    logger              = require('./logger'),
    flow                = require('./flow'),
    util                = require('util'),
    _                   = require('underscore');


var DBCall = function(name, config, model) {
    this.name = name;
    this.config = config;
    this.model = model;
};

DBCall.prototype.run = function(paramData, resultData, fields, callback) {
    
    callback = appUtils.wrapBack(callback);
    var missingParamError = this.findMissingParams(paramData, resultData);
    if(missingParamError) return callback(missingParamError);

    var skipExec = false;
    
    if(this.config.dbcall === 'save') {
        var inst = new this.model(paramData);
        inst.save(callback);
    } else {
        var query = this.model,
            emitSaveEvent = false,
            updateCall = false;

        var dbcall = this.config.dbcall,
            keys = Object.keys(dbcall),
            keysLength = keys.length;
        for(var i=0; i<keysLength; i++) {
            var command = keys[i],
                params = dbcall[command];
            if (command == 'findOneAndUpdate' ) {
                emitSaveEvent = true;
            }
            if ((command == 'findOneAndUpdate' || command == 'update' || command == 'findAndUpdate') && this.model.schema.methods.index) {
                updateCall = command;
            }

            if(_.isEmpty(params)){ 
                query = query[command].call(query, params);
            } else {
                var queryArgs = new ParamParser(params, paramData, resultData).parse();
                if(queryArgs) {
                    //console.log("\t adding %s with %s", command, util.inspect(queryArgs, true, 100));
                    if(util.isArray(queryArgs)) {
                        query = query[command].apply(query, queryArgs);
                    } else {
                        query = query[command].call(query, queryArgs);
                    }
                }
            }
        }
        if(this.debug) {
            logger.info('Calling mongoose dbcall: %s, on model: %s, with op: %s, conditions: %s, updateArg: %s, ', 
                this.name,
                query.model.modelName,
                query.op, 
                util.inspect(query._conditions, 10), 
                util.inspect(query._updateArg, 10));
        }
        if(!skipExec) {
            query.slaveOk();
            query.read('secondary');
            query.exec(_.bind(function(err, result){
                if (err) {
                    return callback(err);
                }
                console.log("RESULT %s", util.inspect(result));
                flow.if(updateCall, function (next) {
                    
                    var findOptionsParams = this.config.dbcall[updateCall][0],
                        findOptions = new ParamParser(findOptionsParams, paramData, resultData).parse();
                    this.model.find(findOptions, function (err, results) {
                        if (err) {
                            return next(err);
                        }
                        _.each(results, function (model) {
                            model.index(function(err, res){
                              model.emit('es-indexed', err, res);
                            });
                        });
                        return next(null);
                    });
                }, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    if(emitSaveEvent) {
                        result.emit('save', result);
                    }
                    if(result) {
                        if(util.isArray(result)) {
                            result = _.invoke(result, 'toObject');
                        } else if('object' === typeof result){
                            result = result.toObject();
                        }
                    }
                    return callback(null, result);
                }, this);
            }, this));
        }
    }
};

DBCall.prototype.findMissingParams = function(inputData, resultData) {
    inputData = inputData || {};
    resultData = resultData || {};
    var missingParamError = new MissingParamsError({}),
        missing = false,
        params = this.config.params;
    if(params) {
        var keys = Object.keys(params),
            keysLength = keys.length;
        for(var i=0; i < keysLength; i++) {
            var name = keys[i],
                config = this.config.params[name];
            if(config.required && (!inputData.hasOwnProperty(name) && !resultData.hasOwnProperty(name))) {
                missingParamError.missing.push(name);
                missing = true;
            }
        }
    }
    
    if(this.config.require_one) {
        var requireOnePassed = false;
        _.each(this.config.require_one, function(requiredField){
            if(inputData.hasOwnProperty(requiredField) || resultData.hasOwnProperty(requiredField)) {
                requireOnePassed = true; 
            }
        });
        if(!requireOnePassed)  {
            missingParamError.missing.push('or: ' + this.config.require_one.toString());
            missing = true;
        }
    }

    if(missing) {
        missingParamError.message = 'DBCall failure: ' + this.name;
        return missingParamError;
    }
    return false;
};

module.exports = DBCall;


