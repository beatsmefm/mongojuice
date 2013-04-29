var _ = require('underscore');

var BlenderCall = function(config, dbCallManager) {
    'use strict';
    this.name = config.name;
    this.db = dbCallManager.get(config.db);
    if (!this.db){ 
        throw new Error('db command does not exist: ' + config.db);
    }
    this.db.debug = this.debug = this.db.hasOwnProperty('debug') ? this.db.debug : config.debug;
    this.db.require = require;
    this.key = config.key;
    this.params = config.params;
    this.fields = config.fields;
    // this.cache = config.cache;
    this.match = config.match;
    this.emits = config.emits;
    this.before = config.before ? config.before.split(':')[0] : null;
    this.after = config.after ? config.after.split(':')[0] : null;
    var next = [];
    if(config.next && config.next.length) {
        _.each(config.next, function(blenderConfig){
            next.push(new BlenderCall(blenderConfig, dbCallManager));
        }, this);
    }
    this.next = next;
};

module.exports = BlenderCall;
