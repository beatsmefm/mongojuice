var _               = require('underscore'),
    fs              = require('fs'),
    util            = require('util'),
    appUtils        = require('./utils'),
    BlenderManager  = require('./blendermanager'),
    DBCallManager   = require('./dbcallmanager'),
    logger          = require('./logger'),
    Cache           = require('./cache'),
    events          = require('events'),
    ParamParser     = require('./paramparser');

var Juicer = function(){};

Juicer.prototype = new events.EventEmitter();

Juicer.prototype.init = function(config) {
    if(!config) {
        throw new Error('config required');
    }
    if(!config.config_dir) {
        throw new Error('config_dir required');
    }
    if(!config.mongoose) {
        throw new Error('mongoose is required');
    }
    this.configDir = config.config_dir;
    this.mongoose = config.mongoose;
    this.cacheDb = config.cache_db;
    this.dbCallManager = new DBCallManager(this.mongoose);
    this.blenderManager = new BlenderManager(this.dbCallManager);
    this.managers = {
        'db': this.dbCallManager,
        'blenders': this.blenderManager
    }
    this.load();
    this.build();

    if(config.cache) {
        this.cache = new Cache({
            port: config.cache.port,
            url: config.cache.url,
            password: config.cache.password
        });
        this.cache.start();
        
        _.each(this.blenderManager.data, function(blenderConfig){
            
            var clearon = blenderConfig.cache ? blenderConfig.cache.clearon : false;
            if(clearon) {
                if(util.isArray(clearon)){
                    _.each(clearon, function(eventClearConfig){
                        
                        this.on(eventClearConfig.name, this.handleClearEvent)
                    }, this);
                } else {
                    this.on(clearon.name, this.handleClearEvent);
                }
            }
        }, this);
    }
    return this;
}

Juicer.prototype.build = function() {
    this.blenderManager.build(this.dbCallManager);
    return this;
}


Juicer.prototype.blend = function(key, params, middleware, callback) {
    if(!callback && 'function' === typeof middleware) {
        callback = middleware || appUtils.wrapBack(callback);
    }
    //logger.info('Starting blend call with key: %s and params %s: ', key, params)
    var blender = this.blenderManager.get(key);
    if(!blender) return callback(new Error('Config does not exist'));
    if(blender.cache && blender.cache.hashkey && blender.cache.resultkey) {
        var hashkey = [],
            resultkey = [];
        _.each(blender.cache.hashkey, function(expression){
            hashkey.push(new ParamParser(expression, params).parse());
        });
        _.each(blender.cache.resultkey, function(expression){
            resultkey.push(new ParamParser(expression, params).parse());
        });
        hashkey = hashkey.join(":");
        resultkey = resultkey.join(":");
        this.cache.get(hashkey, resultkey, _.bind(function(err, result){
            if(err) {
                logger.warn('error retrieving from cache: %s', err);
            }
            if(result) {
                logger.info('found cached result for: %s and %s', hashkey, resultkey);
                return callback(null, result);
            }
            this._blend(blender, key, params, middleware, hashkey, resultkey, callback);

        }, this));
    } else {
        this._blend(blender, key, params, middleware, hashkey, resultkey, callback);
    }
    return this;
}

Juicer.prototype._blend = function(blender, key, params, middleware, hashkey, resultkey, callback){
    blender.blend(key, params, middleware, _.bind(function(err, result){
        callback(err, result);
        if(blender.cache){
            var emits = blender.emits;
            if(blender.cache.set) {
                if(hashkey && resultkey) {
                    this.cache.set(hashkey, resultkey, result, blender.cache.ttl);
                }
                var clearon = blender.cache.clearon;
                if(clearon) {
                    if(util.isArray(clearon)) {
                        _.each(clearon, function(data){
                            var clearonHashKey = this.generateHashKey(data, params);
                            this.cache.set(clearonHashKey, hashkey, 1);
                        }, this);
                    } else if('object' === typeof clearon){
                        var clearonHashKey = this.generateHashKey(clearon, params);
                        this.cache.set(clearonHashKey, hashkey, 1);
                    }
                }
            }
            if(emits) {
                _.each(emits, function(emit){
                    
                    this.emit(emit.name, emit, new ParamParser(emit.params, params).parse());
                }, this);
            }
        }
    }, this));
    return this;
}

Juicer.prototype.generateHashKey = function(config, data) {
    var hashkey = [config.name],
        params = config.params;
    
    _.each(params, function(paramConfig, name){
        hashkey.push(new ParamParser(paramConfig, data).parse());
    });
    hashkey = hashkey.join(":");
    return hashkey;
}

Juicer.prototype.handleClearEvent = function(config, data) {
    var hashkey = this.generateHashKey(config, data);
    
    this.cache.hkeys(hashkey, _.bind(function(err, keys){
        _.each(keys, function(key){
            this.cache.hkeys(key, _.bind(function(err, clearkeys){
                this.cache.removeAllHKeys(key, clearkeys);
            }, this));
        }, this);
    }, this));
}


Juicer.prototype.load = function(){
    if(!fs.existsSync(this.configDir)){
        throw new Error('config_dir does not exist');
    }; 
    _.each(['db', 'blenders'], function(type){
        var files = fs.readdirSync(this.configDir);
        _.each(files, function(file){
            var matches = /([^\.]+)\.([^\.]*)\.(js|config)/.exec(file);
            if(!matches || matches.length !== 4) return;
            var configType = matches[1],
                manager = this.managers[configType];
            if(configType !== type) return;
            if(!manager){
                logger.info('Skipping ', file, ' because unrecognized pattern');
                return;
            }
            try {
                logger.info("trying: ", this.configDir + '/' + file);
                var data  = require(process.cwd() + '/' + this.configDir + '/' + file);
                manager.addConfig(data);
            } catch(e) {
                logger.error('There was an error loading: ', file, ' with error: ', e);
                throw new Error('Invalid file: ', file);
            }  
        }, this);

    }, this);
    return this;
}


module.exports = new Juicer();

module.exports.Juicer = Juicer;






