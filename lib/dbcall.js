var ParamParser         = require('./paramparser'),
    MissingParamsError  = require('./errors/missingparamserror'),
    appUtils            = require('./utils'),
    util                = require('util'),
    _                   = require('underscore');


var DBCall = function(config, model) {
    this.config = config;
    this.model = model;
}

DBCall.prototype.run = function(inputParams, fields, callback) {
    debugger;
    callback = appUtils.wrapBack(callback);
    var missingParamError = this.findMissingParams(inputParams);
    if(missingParamError) return callback(missingParamError);


    if(this.config.dbcall === 'save') {
        var inst = new this.model(inputParams);
        inst.save(callback);
    } else {
        var query = this.model;
        _.each(this.config.dbcall, function(input, command) {
            debugger;
            if(_.isEmpty(input)){
                query = query[command].call(query, {}, [], { lean: true });
            } else {
                var queryArgs = new ParamParser(input, inputParams).parse();
                if(queryArgs) {
                    debugger;
                    if(util.isArray(queryArgs)) {
                        query = query[command].apply(query, queryArgs);
                    } else {
                        query = query[command].call(query, queryArgs);
                    }
                }
            }
        }, this);
        query.lean();
        query.exec(callback);
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
    return missing ? missingParamError : false;
}

module.exports = DBCall;


