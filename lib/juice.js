var _ = require('underscore'),
    fs = require('fs'),
    util = require('util'),
    appUtils = require('./utils'),
    BlenderManager = require('./blendermanager'),
    DBCallManager = require('./dbcallmanager'),
    logger = require('./logger'),
    emitter = require('./emitter'),
    mongoose = require('mongoose'),
    mongooseTypes = require('mongoose-types'),
    ParamParser = require('./paramparser');

mongooseTypes.loadTypes(mongoose);

var Juicer = function() {};

Juicer.prototype.on = function() {
    'use strict';
    emitter.on.apply(emitter, arguments);
};

Juicer.prototype.once = function() {
    'use strict';
    emitter.once.apply(emitter, arguments);
};

Juicer.prototype.emit = function() {
    'use strict';
    emitter.emit.apply(emitter, arguments);
};

Juicer.prototype.Schema = mongoose.Schema;

Juicer.prototype.init = function(config, callback) {
    'use strict';
    if (!config) {
        throw new Error('config required');
    }
    if (!config.config_dir) {
        throw new Error('config_dir required');
    }
    if (!config.dbUri) {
        throw new Error('dbUri is required');
    }
    callback = appUtils.wrapBack(callback);
    this.configDir = config.config_dir;
    this.mongoose = mongoose;
    this.models = {};
    this.dbCallManager = new DBCallManager();
    if (config.logger) {
        logger = config.logger;
        appUtils.setLogger(config.logger);
        this.dbCallManager.logger = logger;
    }
    this.blenderManager = new BlenderManager(this.dbCallManager);
    this.managers = {
        'db': this.dbCallManager,
        'blenders': this.blenderManager,
    };
    var mongoUrl = config.dbUri;
    logger.info({
        source: 'mongojuice:juice:init',
        message: "MONGOJUICE: Trying to connect to mongodb: " + mongoUrl
    });
    mongoose.connect(mongoUrl, _.bind(function(err, connected) {
        if (config.models) {
            fs.readdirSync(config.models).forEach(function(file) {
                require(config.models + '/' + file);
            });
        }
        // this.initCache();
        this.load();
        this.build();
        return callback(err, connected);
    }, this));
};

Juicer.prototype.build = function() {
    'use strict';
    this.blenderManager.build(this.dbCallManager);
    return this;
};

Juicer.prototype.add = function(name, modelConfig, options, indexes, plugins) {
    'use strict';
    var schema = new mongoose.Schema(modelConfig, options);
    _.each(indexes, function(index) {
        if (util.isArray(index)) {
            schema.index.apply(schema, index);
        } else {
            schema.index.call(schema, index);
        }
    });
    if (plugins) {
        _.each(plugins, function(plugin) {
            schema.plugin(plugin.plugin, plugin.config);
        });
    }
    mongoose.model(name, schema);
    return schema;
};

Juicer.prototype.blend = function(key, params, middleware, callback) {
    'use strict';
    if (typeof middleware === 'function') {
        callback = middleware;
    }
    callback = appUtils.wrapBack(callback);
    var blender = this.blenderManager.get(key);
    if (!blender) return callback(new Error('Config does not exist'));
    this._blend(blender, key, params, middleware, null, null, callback);
    return this;
};

Juicer.prototype._blend = function(blender, key, params, middleware, hashkey, resultkey, callback) {
    'use strict';
    blender.blend(key, params, middleware, _.bind(function(callback, err, result) {
        callback(err, result);
        var emits = blender.emits;
        if (emits) {
            _.each(emits, function(emit) {
                var data = new ParamParser(emit.params, params, result).parse();
                logger.info({
                    source: 'mongojuice:juice:_blend',
                    event: emit.name,
                    data: data
                });
                this.emit(emit.name, data);
            }, this);
        }
    }, this, callback));
    return this;
};

Juicer.prototype.generateHashKey = function(config, data) {
    'use strict';
    var hashkey = [config.name],
        params = config.params;

    _.each(params, function(paramConfig) {
        hashkey.push(new ParamParser(paramConfig, data).parse());
    });
    hashkey = hashkey.join(":");
    return hashkey;
};

Juicer.prototype.load = function() {
    'use strict';
    if (!fs.existsSync(this.configDir)) {
        throw new Error('config_dir does not exist');
    }
    _.each(['db', 'blenders'], function(type) {
        var files = fs.readdirSync(this.configDir);
        _.each(files, function(file) {
            var matches = /([^\.]+)\.([^\.]*)\.(js|config)/.exec(file);
            if (!matches || matches.length !== 4) return;
            var configType = matches[1],
                manager = this.managers[configType];
            if (configType !== type) return;
            if (!manager) {
                logger.info({
                    source: 'mongojuic:Juicer:load',
                    message: 'Skipping ' + file + ' because unrecognized pattern'
                });
                return;
            }
            try {
                var data = require(process.cwd() + '/' + this.configDir + '/' + file);
                manager.addConfig(data);
            } catch (e) {
                logger.error({
                    source: 'mongojuic:Juicer:load',
                    error: e
                });
                throw new Error('Invalid file: ', file);
            }
        }, this);

    }, this);
    return this;
};

Juicer.prototype.schemaTypes = function() {
    'use strict';
    return mongoose.SchemaTypes;
};

Juicer.prototype.getModel = function(model) {
    'use strict';
    return mongoose.model(model);
};

module.exports = new Juicer();

module.exports.Juicer = Juicer;