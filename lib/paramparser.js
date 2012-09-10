var util = require('util'),
    _    = require('underscore');

var funks = {
    map: {
        regex: /^\$map\(@([^,]+),\s*([^\)]+)\)/,
        handler: function(matches, data) {
            
            var results = [],
                data = matches[1] === 'result' ? this.data : this.determineValue('@' + matches[1], '@');
            _.each(data, function(item){
                if('object' === typeof item) {
                    results.push(item[matches[2]]);
                }
                
            });
            return results;
        }
    },
    now: {
        regex: /^\$now/,
        handler: function() {
            return new Date();
        }
    }
}

var ParamParser = function(params, data){
    this.params     = params;
    this.data       = data || {};
}

ParamParser.prototype.parse = function(){
    
    if('string' === typeof this.params) {
        return this._parse(this.params);
    } else {
        var args = util.isArray(this.params) ? [] : {};
        _.each(this.params, function(paramData, paramName){
            args[paramName] = this._parse(paramData);
        }, this);
        return args;
    }
    
}

ParamParser.prototype._parse = function(expression) {
    var args = {};
    if(expression) {
        if(util.isArray(expression)) {
            var values = [];
            _.each(expression, function(item){
                values.push(this._parse(item));
            }, this);
            
            return values;
        } else if('object' === typeof expression) {
            _.each(expression, function(paramData, name){
                var parsedExpression = this._parse(paramData);
                if(parsedExpression) {
                    args[name] = parsedExpression;
                }
            }, this);
            return args;
        } else if('string' === typeof expression) {
            if(expression.indexOf('$') === 0) {
                var funkFound = false,
                    results = null;
                _.each(funks, function(data, name){
                    if(funkFound) return;
                    var matches = data.regex.exec(expression);
                    if(matches) {
                        funkFound = true;
                        results = data.handler.call(this, matches)
                    }
                }, this);
                return results;
            } else if(expression.indexOf(':') === 0) {
                
               return this.determineValue(expression, ':', false);
            } else if(expression.indexOf('@') === 0) {
                return this.determineValue(expression, '@', true);
            } else {
                return expression;
            }
        } else if('boolean' === typeof expression) {
            return expression;
        }
    } else {
        return false;
    }
}

ParamParser.prototype.determineValue = function(expression, splitChar, isResult){
    var objName = expression.split(splitChar)[1],
        dotIndex = objName.indexOf('.'),
        obj = null;
    if(dotIndex >= 0) {
        var fields = objName.split('.'),
            first = fields[0],
            isResult = isResult && first === 'result',
            baseObj = this.data,
            i = isResult  ? 1 : 0;
        
        for(i; i < fields.length; i++) {
            baseObj = baseObj[fields[i]];
        }
        obj = baseObj;
    } else {
        obj = this.data[objName];
    }
    return obj;
}

module.exports = ParamParser;