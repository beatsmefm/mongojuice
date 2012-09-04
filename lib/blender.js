var _ = require('underscore'),
    async = require('async'),
    logger = require('./logger'),
    util = require('util'),
    appUtils = require('./utils'),
    DBCall = require('./dbcall'),
    ParamParser = require('./paramparser'),
    MissingParamsError = require('./errors/missingparamserror');

var Blender = function(key, config, dbCallManager){
    if(!key) throw new Error('Invalid config, no key');
    this.name = key;
    this.callConfigs = config.commands;
    this.requiredFields = config.required_fields;
    this.blenderCalls = [];
    this.dbCallManager = dbCallManager;
    this.build();
    debugger;
    this.cache = config.cache;
}


Blender.prototype.blend = function(key, params, callback){
    if(key.indexOf('db.') === 0) {
        var dbCall = this.dbCallManager.get(key.substring(3));
        return dbCall.run(params, callback);
    } else {
        var requiredFields = this.requiredFields,
            missingFields = [];
        if(requiredFields && requiredFields.length) {
            _.each(requiredFields, function(requiredField){
                if(!params[requiredField]) {
                    missingFields.push(requiredField);
                }
            });
        }
        if(missingFields && missingFields.length) {
            return callback(new MissingParamsError({
                missing: missingFields
            }));
        }
        var result = {};
        this._blend(this.blenderCalls, params, result, function(err){
            //that.cache[hashkey] = result;
            return callback(err, result);
        });
    }
}


Blender.prototype._blend = function(calls, params, parent, callback) {
    if(!calls && !calls.length) return callback(null, result);
    var parallelCalls = {};
    _.each(calls, function(blenderCall) {
        var wrappedCall = {},
            that = this;
        parallelCalls[blenderCall.key] = _.bind(function(cb) {
            return this.makeCall(params, parent, blenderCall, cb);
        }, this)
    }, this);
    async.parallel(parallelCalls, function(err, results){
        if(err) return callback(err);
        debugger;
        _.each(results, function(callsResult) { _.extend(results, callsResult) });
        return callback(null, results);
    });
}

Blender.prototype.makeCall = function(params, parent, blenderCall, callback) {
    callback = appUtils.wrapBack(callback);
    if(!blenderCall) return callback(new MissingParamsError('No blenderCall to be made'));
    var callParams = new ParamParser(blenderCall.params, _.extend(parent || {}, params)).parse();
    blenderCall.db.run(callParams, blenderCall.fields, _.bind(function(err, result){
        var next  = blenderCall.next;
        this.applyResult(blenderCall, parent, result);
        this._blend(next, params, result, callback);
    }, this));
}

Blender.prototype.applyResult = function(config, parent, result) {
    if(util.isArray(parent)){
        if (!config.match || !config.match.on) {
            logger.error('Configuration for %s', util.inspect(config), ' has parent result that is an array.  You must specify "match" parameter on child result.  See documentation.');
            throw new Error('Configuration missing match data');
        }
        _.each(parent, function(parentResult){
            _.each(result, function(childResult) {
                var matches = 0,
                    matchOnLength = config.match.on.length;
                _.each(config.match.on, function(match){
                    subkey = _.values(match)[0],
                    parentkey = _.keys(match)[0];

                    var resultFieldVal = childResult[subkey],
                        parentFieldVal = parentResult[parentkey];
                    if(resultFieldVal && parentFieldVal && resultFieldVal.toString() === parentFieldVal.toString()) {
                        matches++;
                    }
                });
                if(matches === matchOnLength) {
                    if(config.match.has_many) {
                        var currentFieldValue = parentResult.get(config.key) || [];
                        currentFieldValue.push(childResult);
                        parentResult.set(config.key, currentFieldValue);
                    } else {
                        parentResult.set(config.key, childResult);
                    }
                    
                }
            });
        });
    } else {
        parent[config.key] = result;
    }
}

Blender.prototype.build = function(){
    _.each(this.callConfigs, function(config){
        this.blenderCalls.push(new BlenderCall(config, this.dbCallManager));
    }, this);
}

//juicer.blend('db.find_by_id', params, callback);


var BlenderCall = function(config, dbCallManager) {
    this.name = config.name;
    this.dbCallManager = dbCallManager;
    this.db = dbCallManager.get(config.db);
    if (!this.db){ 
        throw new Error('db command does not exist: ' + config.db);
    }
    this.key = config.key;
    this.params = config.params;
    this.fields = config.fields;
    this.cache = config.cache;
    this.emit = config.emit;
    this.match = config.match;
    var next = [];
    if(config.next && config.next.length) {
        _.each(config.next, function(blenderConfig){
            next.push(new BlenderCall(blenderConfig, this.dbCallManager));
        }, this);
    }
    this.next = next;
}

module.exports = Blender;