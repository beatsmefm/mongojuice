var _       = require('underscore'),
    Blender = require('./blender');

var BlenderManager = function(dbCallManager) {
    'use strict';
    this.ready = false;
    this.data = {};
    this.blenders = {};
    this.dbCallManager = dbCallManager;
};

BlenderManager.prototype.addConfig = function(data) {
    'use strict';
    _.each(data, function(config, key){
        if(this.data[key]) {
            throw new Error('blender call already exists: ' + key);
        } 
    }, this);
    _.extend(this.data, data);
};

BlenderManager.prototype.build = function() {
    'use strict';
    _.each(this.data, function(config, key){
        this.blenders[key] = new Blender(key, config, this.dbCallManager);
    }, this);
    this.ready = true;
};

BlenderManager.prototype.get = function(key) {
    'use strict';
    return this.blenders[key];
};

module.exports = BlenderManager;
