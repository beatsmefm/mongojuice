var logger = require('./logger'),
    _      = require('underscore');

exports.wrapBack = function(callback) {
    if(!callback) {
      return function(){};
    }
    return function cb() {
      var err = arguments[0];
      if(err){
        logger.error(err.stack || err.toString());
      }
      return callback.apply(arguments.callee, arguments);
    };
}

exports.tick = function tick (callback) {
  if ('function' !== typeof callback) return;
  return function () {
    try {
      callback.apply(this, arguments);
    } catch (err) {
      // only nextTick on err to get out of
      // the event loop and avoid state corruption.
      process.nextTick(function () {
        throw err;
      });
    }
  }
}