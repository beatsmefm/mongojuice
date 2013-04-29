var tracer = require('tracer');

module.exports = tracer.console({
  transport : function(data) {
    'use strict';
    console.log(data.output);
  }
});