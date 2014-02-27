var logger = require('./logger');

function wrapBack(callback) {
    'use strict';
    if (!callback) {
        return function() {};
    }
    return function cb() {
        var err = arguments[0];
        if (err) {
            logger.error({
                source: 'mongojuice',
                error: err
            });
        }
        return callback.apply(wrapBack, arguments);
    };
}

function tick(callback) {
    'use strict';
    if ('function' !== typeof callback) return;
    return function() {
        try {
            callback.apply(this, arguments);
        } catch (err) {
            // only nextTick on err to get out of
            // the event loop and avoid state corruption.
            process.nextTick(function() {
                throw err;
            });
        }
    };
}

exports.wrapBack = wrapBack;
exports.tick = tick;
exports.logger = logger;