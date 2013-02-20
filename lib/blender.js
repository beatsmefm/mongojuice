var _ = require('underscore'),
    async = require('async'),
    logger = require('./logger'),
    util = require('util'),
    appUtils = require('./utils'),
    emitter = require('./emitter'),
    DBCall = require('./dbcall'),
    ParamParser = require('./paramparser'),
    MissingParamsError = require('./errors/missingparamserror');

var Blender = function(key, config, dbCallManager){
    if(!key) throw new Error('Invalid config, no key');
    this.name = key;
    this.callConfigs = config.commands;
    this.requiredFields = config.required_fields;
    this.emits = config.emits;
    this.blenderCalls = [];
    this.dbCallManager = dbCallManager;
    this.build();
    this.normalize = config.normalize;
    this.cache = config.cache;
}


Blender.prototype.blend = function(key, params, middleware, callback){
    if(key.indexOf('db.') === 0) {
        var dbCall = this.dbCallManager.get(key.substring(3));
        return dbCall.run(params, callback);
    } else {
        var requiredFields = this.requiredFields,
            requiredFieldsLength = requiredFields && requiredFields.length,
            missingFields = [];
        if(requiredFieldsLength) {
            for(var i=0; i < requiredFieldsLength; i++) {
                var requiredField = requiredFields[i];
                if(!params.hasOwnProperty(requiredField)) {
                    missingFields.push(requiredField);
                }
            }
        }
        if(missingFields && missingFields.length) {
            return callback(new MissingParamsError({
                missing: missingFields
            }));
        }
        var result = {};
        this._blend(this.blenderCalls, params, result, middleware, _.bind(function(callback, result, err){
            
            return callback(err, result);
        }, this, callback, result));
    }
}


Blender.prototype._blend = function(calls, params, parent, middleware, callback) {
    if(!calls && !calls.length) return callback(null, result);
    var parallelCalls = {},
        callsLength = calls.length;
    for(var i=0; i < callsLength; i++) {
        var blenderCall = calls[i],
            wrappedCall = {};
        parallelCalls[blenderCall.key || blenderCall.db] = _.bind(function(cb) {
            return this.makeCall(params, parent, blenderCall, middleware, cb);
        }, this)
    }
    async.parallel(parallelCalls, function(err, results){
        if(err) return callback(err);
        var resultsLength = results && results.length;

        if(resultsLength) {
            for(var i=0; i < resultsLength; i++) {
                _.extend(results, results[i]);
            }
        }
        return callback(null, results);
    });
}

Blender.prototype.makeCall = function(params, parent, blenderCall, middleware, callback) {
    var middle = new ParamParser({ after: blenderCall.after, before: blenderCall.before }, middleware).parse();
    callback = appUtils.wrapBack(callback);
    if(!blenderCall) return callback(new Error('No blenderCall to be made'));
    async.waterfall([
        _.bind(middle.before || function(data, next) { 
            return next(null, data) 
        }, this, parent),
        _.bind(function(data, next) {
            if(!data) {
                return next(null, false);
            }
            parent = data;
            var callParams = new ParamParser(blenderCall.params, params, data).parse();
            if(!next && 'function' === typeof data){
                next = data;
            }
            blenderCall.db.run(callParams, data, blenderCall.fields, _.bind(function(err, callResult){
                if(blenderCall.debug) {
                    
                    logger.info('Returned result from blenderCall: %s - %s', blenderCall.name, util.inspect(callResult));
                }
                next(err, callResult);
            }, this));
        }, this),
        _.bind(middle.after || function(data, next) { 
            return next(null, data);
        }, this)
    ], _.bind(function(err, result) {
        if(err) {
            return callback(err.type === 'MissingParamsError' ? null : err);
        }
        if(!result || (_.isArray(result) && !result.length)) return callback();
        var next  = blenderCall.next;
        
        this.applyResult(blenderCall, parent, result);
        var emits = blenderCall.emits;
        if(emits) {
            var emitsLength = emits.length;
            for(var i=0; i < emitsLength; i++) {
                var emit = emits[i],
                    data = new ParamParser(emit.params, params, parent).parse();
                logger.info('emitting %s with params %s', emit.name, util.inspect(data));
                emitter.emit(emit.name, data);
            }
        }
        this._blend(next, params, this.normalize ? parent : result, middleware, callback);
    }, this));
}

Blender.prototype.applyResult = function(config, parent, result) {
    if(!this.normalize && util.isArray(parent)){
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
                        parentResult[config.key] = currentFieldValue;
                    } else {
                        parentResult[config.key] = childResult;
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
        this.blenderCalls.push(new BlenderCall(_.extend({}, { debug: this.debug }, config), this.dbCallManager));
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
    this.db.debug = this.debug = this.db.hasOwnProperty('debug') ? this.db.debug : config.debug;
    this.key = config.key;
    this.params = config.params;
    this.fields = config.fields;
    this.cache = config.cache;
    this.match = config.match;
    this.emits = config.emits;
    this.before = config.before;
    this.after = config.after;
    var next = [];
    if(config.next && config.next.length) {
        _.each(config.next, function(blenderConfig){
            next.push(new BlenderCall(blenderConfig, this.dbCallManager));
        }, this);
    }
    this.next = next;
}


module.exports = Blender;