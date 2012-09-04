var _       = require('underscore'),
    Blender = require('./blender');


var BlenderManager = function(dbCallManager) {
    this.hasData = false;
    this.ready = false;
    this.data = {};
    this.blenders = {};
    this.dbCallManager = dbCallManager;
};

BlenderManager.prototype.isEmpty = function(){
    return !this.hasData;
}

BlenderManager.prototype.addConfig = function(data) {
    _.each(data, function(config, key){
        if(this.data[key]) {
            throw new Error('blender call already exists: ' + key);
        } 
    }, this);
    this.hasData = true;
    _.extend(this.data, data);
}

BlenderManager.prototype.build = function() {
    _.each(this.data, function(config, key){
        this.blenders[key] = new Blender(key, config, this.dbCallManager);
    }, this);
    this.ready = true;
}

BlenderManager.prototype.get = function(key) {
    return this.blenders[key];
}

module.exports = BlenderManager;
