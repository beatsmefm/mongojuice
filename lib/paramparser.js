var util = require('util'),
    _    = require('underscore');

var funks = {
    map: {
        regex: /^\$map\(@([^,]+),\s*([^\)]+)\)/,
        handler: function(matches) {
            'use strict';
            var results = [],
                data = matches[1] === 'result' ? this.resultData : this.determineValue('@' + matches[1], '@'),
                secondMatch = matches[2];

            _.each(data, function(item){
                if('object' === typeof item) {
                    results.push(item[secondMatch]);
                }
            });
            return results;
        }
    },
    now: {
        regex: /^\$now/,
        handler: function() {
            'use strict';
            return new Date();
        }
    }
};

var ParamParser = function(params, paramData, resultData){
    'use strict';
    this.params = params;
    this.paramData = paramData;
    this.resultData = resultData || {};
};

ParamParser.prototype.parse = function(){
    'use strict';
    if('string' === typeof this.params) {
        return this._parse(this.params);
    } else {
        var args = util.isArray(this.params) ? [] : {},
            params = this.params;
        if(params) {
            var keys = Object.keys(this.params),
                keysLength = keys.length;
            for(var i=0; i<keysLength; i++) {
                var paramName = keys[i],
                    paramExpression = this.params[paramName];
                
                paramName = this._parse(paramName);

                var result = this._parse(paramExpression);
                if ('undefined' !== typeof result) {
                    args[paramName] = result;
                }
            }
        }
        return args;
    }
};

ParamParser.prototype.parseDollar  = function (expression) {
    'use strict';
    var funkFound = false,
        results = null;

    var keys = Object.keys(funks),
        keysLength = keys.length,
        name, i;
    for(i = 0; i < keysLength; i++) {
        name = keys[i];
        var data = funks[name];
        if(!funkFound) {
            var matches = data.regex.exec(expression);
            if(matches) {
                funkFound = true;
                results = data.handler.call(this, matches);
            }
        }
    }
    return results;
};

ParamParser.prototype.parseArray = function (expression) {
    'use strict';
    var values = [],
        length = expression.length,
        i, item, parsedItem;
    for(i = 0; i < length; i++) {
        item = expression[i];
        parsedItem = this._parse(item);
        if(!parsedItem || !parsedItem.length) return;
        if(typeof parsedItem === "object") {
            values.push(parsedItem);
        } else {
            var index = values.indexOf(parsedItem);
            if(index < 0) values.push(parsedItem);
        }
    }
    return values;
};

ParamParser.prototype.parseObject = function (expression) {
    'use strict';
    var keys = Object.keys(expression),
        args = {},
        keysLength = keys.length,
        i, name, paramExpression, parsedExpression;
    for(i = 0; i < keysLength; i++) {
        name = keys[i];
        paramExpression = expression[name];
        parsedExpression = this._parse(paramExpression);
        if(null !== parsedExpression && 'undefined' !== typeof parsedExpression) {
            args[name] = parsedExpression;
        }
    }
    return args;
};

ParamParser.prototype._parse = function(expression) {
    'use strict';
    var type = typeof expression;
    if(type !== 'undefined') {
        if(util.isArray(expression)) {
            return this.parseArray(expression);
        } else if('object' === type) {
            return this.parseObject(expression);
        } else if('string' === type) {
            if(expression.indexOf('$') === 0) {
                return this.parseDollar(expression);
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
};

ParamParser.prototype.determineValue = function(expression, splitChar, isResult){
    'use strict';
    var objName = expression.split(splitChar)[1],
        dotIndex = objName.indexOf('.'),
        obj = null;
    if(dotIndex > 0) {
        var fields = objName.split('.'),
            first = fields[0];
        isResult = isResult && first === 'result';
        var baseObj = _.extend({}, this.paramData, !_.isArray(this.resultData) && this.resultData),
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
};

module.exports = ParamParser;
