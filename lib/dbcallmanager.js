var _       = require('underscore'),
    DBCall  = require('./dbcall'),
    logger  = require('./logger'),
    mongoose = require('mongoose');

var DBCallManager = function() {
    'use strict';
    this.data = {};
    this.hasData = false;
};

DBCallManager.prototype.isEmpty = function(){
    'use strict';
    return !this.hasData;
};

DBCallManager.prototype.addConfig = function(data) {
    'use strict';
    _.each(data, function(config, key){
        if(this.data[key]) {
            throw new Error('db call already exists: ' + key);
        }
    }, this);
    this.hasData = true;
    _.extend(this.data, data);
};

DBCallManager.prototype.get = function(key) {
    'use strict';
    var config = this.data[key];
    if(!config) return false;
    var model = mongoose.model(config.model);
    if(!model) {
        logger.error('There is no model: ' + config.model + ' for config: ' + key);
        return false;
    }
    return new DBCall(key, config, model);
};

module.exports = DBCallManager;

