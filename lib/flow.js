var flow = {
  if: function(condition, ifTrue, next, context){
    'use strict';
    if (condition){
      ifTrue.call(context, next);
    } else {
      next.call(context);
    }
  },
  ifelse: function (condition, ifTrue, ifFalse, next, context) {
    'use strict';
    if (condition){
      ifTrue.call(context, next);
    } else {
      ifFalse.call(context, next);
    }
  }
};

module.exports = flow;