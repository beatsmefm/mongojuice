var logger  = require('../logger'),
    util    = require('util'),
    _       = require('underscore');

var MissingParamsError = module.exports = function(data){
    Error.call(this);
    Error.captureStackTrace(this, arguments.callee);
    this.message = data.msg,
    this.params = data.params;
    this.missing = data.missing || [];
    this.type = "MissingParamsError";
    this.errors = data.errors;
};

MissingParamsError.prototype.__proto__ = Error.prototype;

MissingParamsError.prototype.toString = function(){
    var str = [this.message ? this.message + '\n' : ''];
    _.each(this.missing, function(field){
        str.push("Missing: " + field + "\n");
    });
    return str.join("");
}

MissingParamsError.prototype.debugToString = function(){
    var debugStr = this.type;
    debugStr += util.inspect(this);
    return debugStr;
}
