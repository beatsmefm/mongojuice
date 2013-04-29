var util    = require('util'),
    _       = require('underscore');

var MissingParamsError = module.exports = function(data){
    'use strict';
    Error.call(this);
    Error.captureStackTrace(this, MissingParamsError);
    this.message = data.msg,
    this.params = data.params;
    this.missing = data.missing || [];
    this.type = "MissingParamsError";
    this.errors = data.errors;
};

util.inherits(MissingParamsError, Error);

MissingParamsError.prototype.toString = function(){
    'use strict';
    var str = [this.message ? this.message + '\n' : ''];
    _.each(this.missing, function(field){
        str.push("Missing: " + field + "\n");
    });
    return str.join("");
};

MissingParamsError.prototype.debugToString = function(){
    'use strict';
    var debugStr = this.type;
    debugStr += util.inspect(this);
    return debugStr;
};
