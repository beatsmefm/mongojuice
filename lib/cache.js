var _ = require('underscore'),
    logger = require('./logger'),
    redis = require("redis"),
    util = require('util'),
    appUtil = require('./utils');

var Cache = module.exports = function(options){
    _.extend(this, options);
}

Cache.prototype.start = function(callback){
    client = redis.createClient(this.port, this.url);
    
    if(this.password) {
        client.auth(this.password);
    }
    

    client.on('connect', function(err){
        logger.info('connected redis', err);
    });
}

Cache.prototype.hkeys = function(hashkey, callback) {
    callback = appUtil.wrapBack(callback);
    client.hkeys(hashkey, callback);
}

Cache.prototype.get = function(hashkey, resultkey, callback){
    callback = appUtil.wrapBack(callback);
    var now = new Date().getTime();
    client.hget(hashkey, resultkey, function(err, result){
        if(err || !result) return callback(err);
        
        result = JSON.parse(result);
        var next = new Date().getTime();
        logger.info("CACHE",  next - now);
        return callback(null, result);
    });
};

Cache.prototype.set = function(hashkey, resultkey, result, ttl){
    ttl = ttl ? parseFloat(ttl) : undefined;
    logger.info("Setting single: %s on %s with ttl: %d", hashkey, resultkey, ttl || -1);
    client.hset(hashkey, resultkey, JSON.stringify(result));
    if(ttl) {
       client.send_command("expire", [hashkey, ttl]); 
    }
};

Cache.prototype.remove = function(hashkey, callback){
    callback = appUtil.wrapBack(callback);
    logger.info("REMOVING FROM CACHE: ", hashkey);
    client.hkeys(hashkey, function(err, replies){
        if(!err && replies && replies.length){
            //console.log('REMOVING CMD:', "hdel", [model.type + ":" + id].concat(replies));
            client.send_command("hdel", [hashkey].concat(replies), function(err, result){
                return callback();
            });
        } else {
            return callback();
        }
    });  
}


Cache.prototype.removeAllHKeys = function(hashkey, keys, callback) {
    callback = appUtil.wrapBack(callback);
    logger.info("REMOVING ALL KEYS FROM CACHE ", hashkey, util.inspect(keys));
    var multi = [];
    _.each(keys, function(key){
        multi.push(['hdel', hashkey, key]);
    });
    client.multi(multi).exec(function(err, results){
        
    });
}
