var _       = require('underscore'),
    DBCall  = require('./dbcall');


var DBCallManager = function(mongoose) {
    this.data = {};
    this.hasData = false;
    this.mongoose = mongoose;
};


DBCallManager.prototype.isEmpty = function(){
    return !this.hasData;
}

DBCallManager.prototype.addConfig = function(data) {
    _.each(data, function(config, key){
        if(this.data[key]) {
            throw new Error('db call already exists: ' + key);
        }
    }, this);
    this.hasData = true;
    _.extend(this.data, data);
}

DBCallManager.prototype.get = function(key) {
    var config = this.data[key];
    if(!config) return false;
    var model = this.mongoose.model(config.model);
    if(!model) {
        logger.error('There is no model: ' + config.model + ' for config: ' + key);
        return false;
    }
    return new DBCall(config, model);
}

module.exports = DBCallManager;

