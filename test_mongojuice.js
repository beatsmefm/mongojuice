var j = require('./index.js'),
    async = require('async'),
    util = require('util');

var profiler = require('v8-profiler');
    
function start(profiler, req, res) {
    var parallel = [],
        i = 0,
        i2 = 0;


    var snapshot = profiler.takeSnapshot(['mongojuice']) ;     //takes a heap snapshot

    profiler.startProfiling(['mongojuice']) ;                  //begin cpu profiling
    
    while(i < 1000) {
        parallel.push(function(cb){
          j.blend('load_user_by_id', {
            id: '5089b7302b503a0200000008'
          }, function(err, result) {
            //console.log(err, util.inspect(result, true, 100));
            cb(err, result);
            //console.log("RESULT", result);
          });
        });
        i++;
    }   
    var t = new Date().getTime();
        
    async.parallel(parallel, function(err, result){
      console.log(new Date().getTime() - t);

      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Hello World ');
      profiler.stopProfiling(['mongojuice']);

      var t2 = new Date().getTime(),
          nCalls = [],
          func = function(cb){
            var finalResults = {},
                User = j.models['User'];

            finalResults['user'] = function(cb){
              return User.findOne(
                { _id: '5089b7302b503a0200000008' }, 
                { email: 1 }
              ).exec(function(err, result){
                cb(err, result.toJSON());
              });
            }
            finalResults['user2'] = function(cb) {
              return User.findOne(
                { _id: '5089b7302b503a0200000008' }, 
                { email: 1 }
              ).exec(function(err, result){
                result = result.toJSON();
                User.findOne(
                  { _id: '5089b7302b503a0200000008' }, 
                  { email: 1 }
                ).exec(function(err, result3rd){
                  result['user3'] = result3rd = result3rd.toJSON();
                  User.findOne(
                    { _id: '5089b7302b503a0200000008' }, 
                    { email: 1 }
                  ).exec(function(err, result4th){
                    result3rd['user4'] = result4th = result4th.toJSON();
                    User.findOne(
                      { _id: '5089b7302b503a0200000008' }, 
                      { email: 1 }
                    ).exec(function(err, result5th){
                      result4th['user5'] = result5th = result5th.toJSON();
                      return cb(null, result)
                    });
                  });
                });
              });
            }
            async.parallel(finalResults, function(err, result){
                return cb(err, result);
            });
          }
          // var i3 = 0,
          //     nTime = new Date().getTime(),
          //     nParallel = [];
          // while(i3 < 1000) {
          //   nParallel.push(func);
          //   i3++;
          // }
          // async.parallel(nParallel, function(err, result){
          //   console.log("No mongojuice time:", new Date().getTime() - nTime);
          // });
          
    }); 
}

j.init({
    config_dir: './config',
    models: './tests/lib/models',
    // cache: env.redis,
    db: {
      "username": "mongocrate",
      "password": "wegotthebeat",
      "host": "ds039297.mongolab.com",
      "port": 39297,
      "name": "heroku_app9088460"
    }
}, function(err, connected){
    if(err) {
        logger.error(err);
        throw new Error('Unable to initialize the db');
    }
    var http = require('http');
    var profiler = require('v8-profiler');

    var x = 0;
    http.createServer(function (req, res) {
      x += 1;
      profiler.startProfiling(['mongojuice']);
      start(profiler, req, res);
    }).listen(8124);
    profiler.takeSnapshot('Post-Server Snapshot');
    console.log('Server running at http://127.0.0.1:8124/');
});





