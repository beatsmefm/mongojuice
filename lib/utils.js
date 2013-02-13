var logger = require('./logger');

exports.wrapBack = function(callback) {
    'use strict';
    if(!callback) {
      return function(){};
    }
    return function cb() {
      var err = arguments[0];
      if(err){
        logger.error(err.stack || err.toString());
      }
      return callback.apply(this.wrapBack, arguments);
    };
};

exports.tick = function tick (callback) {
  'use strict';
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
  };
};