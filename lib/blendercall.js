var _ = require('underscore'),
    logger = require('./logger');

var BlenderCall = function(config, dbCallManager) {
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
    this.cache = config.cache;
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
    this.exec = this._buildBlenderExec();
}

BlenderCall.prototype._buildBlenderExec = function() {
    var paramStr = "params, data, callback",
        func = [];
    func.push("var paramsToPass = {};");
    if(this.params) {
        _.each(this.params, function(expression, key){
            var value = null;
            if(expression.indexOf('$') === 0) {

            } else if(expression.indexOf('@') === 0) {
                var objName = expression.split("@")[1],
                    dotIndex = objName.indexOf('.'),
                    fields = objName.split('.'),
                    first = fields[0],
                    isResult = first === 'result';
                if(isResult) {
                    fields[0] = "data";
                } else {
                    fields.unshift("data");
                }
                value = fields.join('.');
            } else if(expression.indexOf(':') === 0) {
                value = "params['" + expression.split(':')[1] + "']";
            } else {
                value = expression;
            }
            
            func.push("paramsToPass['" + key + "'] = " + value + ";");
        });
    }
    func.push("this.db.exec(params, callback);");
    func = func.join('\n');
    //logger.info("\nXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n", func, "\nXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n");
    return new Function(paramStr, func);
}


module.exports = BlenderCall;