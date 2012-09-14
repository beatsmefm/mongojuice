var ParamParser         = require('./paramparser'),
    MissingParamsError  = require('./errors/missingparamserror'),
    appUtils            = require('./utils'),
    logger              = require('./logger'),
    util                = require('util'),
    _                   = require('underscore');


var DBCall = function(name, config, model) {
    this.name = name;
    this.config = config;
    this.model = model;
}

DBCall.prototype.run = function(inputParams, fields, callback) {
    
    callback = appUtils.wrapBack(callback);
    var missingParamError = this.findMissingParams(inputParams);
    if(missingParamError) return callback(missingParamError);

    if(this.config.dbcall === 'save') {
        var inst = new this.model(inputParams);
        inst.save(callback);
    } else {
        var query = this.model;
        _.each(this.config.dbcall, function(input, command) {
            
            if(_.isEmpty(input)){
                query = query[command].call(query, input);
            } else {
                var queryArgs = new ParamParser(input, inputParams).parse();
                if(queryArgs) {
                    
                    if(util.isArray(queryArgs)) {
                        query = query[command].apply(query, queryArgs);
                    } else {
                        query = query[command].call(query, queryArgs);
                    }
                }
            }
        }, this);
        // if(query.lean){
        //     query.lean();
        // }
        if(this.debug) {
            logger.info('Calling mongoose dbcall: %s, on model: %s, with op: %s, conditions: %s, updateArg: %s, ', 
                this.name,
                query.model.modelName,
                query.op, 
                util.inspect(query._conditions, 10), 
                util.inspect(query._updateArg, 10));
        }
        query.exec(function(err, result){
            if(result) {
                if(util.isArray(result)) {
                    result = _.invoke(result, 'toObject');
                } else if('object' === typeof result){
                    result = result.toObject();
                }
            }
            return callback(err, result);
        });
    }
}


DBCall.prototype.findMissingParams = function(inputParams) {
    var missingParamError = new MissingParamsError({}),
        missing = false;
    _.each(this.config.params, function(config, name){
        if(config.required && !inputParams.hasOwnProperty(name)) {
            missingParamError.missing.push(name);
            missing = true;
        }
    });
    
    if(this.config.require_one) {
        var requireOnePassed = false;
        _.each(this.config.require_one, function(requiredField){
            if(inputParams.hasOwnProperty(requiredField)) {
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
}

module.exports = DBCall;


