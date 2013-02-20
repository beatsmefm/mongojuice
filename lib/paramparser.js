var util = require('util'),
    _    = require('underscore');

var funks = {
    map: {
        regex: /^\$map\(@([^,]+),\s*([^\)]+)\)/,
        handler: function(matches, data) {
            
            var results = [],
                data = matches[1] === 'result' ? this.resultData : this.determineValue('@' + matches[1], '@');

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

var ParamParser = function(params, paramData, resultData){
    this.params     = params;
    this.paramData = paramData;
    this.resultData       = resultData || {};
}

ParamParser.prototype.parse = function(){
    
    if('string' === typeof this.params) {
        return this._parse(this.params);
    } else {
        var args = util.isArray(this.params) ? [] : {};
        _.each(this.params, function(paramExpression, paramName){
            var result = this._parse(paramExpression);
            
            if ('undefined' != typeof result) {
                args[paramName] = result;
            }
        }, this);
        return args;
    }
    
}

ParamParser.prototype._parse = function(expression) {
    var args = {},
        type = typeof expression;
        
    if(type !== 'undefined') {
        if(util.isArray(expression)) {
            var values = [];
            _.each(expression, function(item){
                var parsedItem = this._parse(item);
                var index = values.indexOf(parsedItem);
                if(index < 0) values.push(this._parse(item));
            }, this);
            
            return values;
        } else if('object' === type) {
            _.each(expression, function(paramExpression, name){
                var parsedExpression = this._parse(paramExpression);
                if(parsedExpression != null) {
                    args[name] = parsedExpression;
                }
            }, this);
            return args;
        } else if('string' === type) {
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
        } else if('boolean' === type || 'number' === type) {
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
    if(dotIndex > 0) {
        var fields = objName.split('.'),
            first = fields[0],
            isResult = isResult && first === 'result',
            baseObj = _.extend({}, this.paramData, !_.isArray(this.resultData) && this.resultData),
            i = isResult  ? 1 : 0;
        
        for(i; i < fields.length; i++) {
            baseObj = baseObj[fields[i]];
        }
        obj = baseObj;
    } else {
        if(this.paramData.hasOwnProperty(objName)){
            obj = this.paramData[objName];
        } else if(!_.isArray(this.resultData)) {
            obj = this.resultData[objName];
        }
    }
    return obj;
}

module.exports = ParamParser;