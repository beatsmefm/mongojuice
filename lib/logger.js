var fs = require('fs'),
	 tracer = require('tracer');

module.exports = tracer.console({
  transport : function(data) {
    console.log(data.output);
  }
});