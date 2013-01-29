const express = require('express'),
      app = express.createServer(),
      io = require('socket.io').listen(app),
      config = require('./config'),
      memwatch = require('memwatch'),
      j = require('./index.js'),
      async = require('async'),
      util = require('util');

var hd = new memwatch.HeapDiff();
var lastHD = Date.now();
var clients = [];
var paused = false;


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
  start();
});


var start = function(){
  app.configure(function(){
    app.use(express.static(__dirname + '/static'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  app.listen(3000, function() {
    console.log("server listening on port %d", 3000);
  });

  // reduce socket.io logging noise
  io.set('log level', 1);

  io.sockets.on('connection', function(socket) {
    clients.push(socket);

    socket.emit('configure', config.clientConfig);

    socket.on('disconnect', function() {
      clients.splice(clients.indexOf(socket), 1);
    });

    // The buttons in the console can cause us to force GC or do a bunch of work
    socket.on('message', function(message) {
      switch (message) {
        case "do_gc":
          memwatch.gc();
          break;

        case "add_load":
          mj();
          break;

        case "pause":
          io.sockets.emit('pause', {paused: togglePause()});
          break;

        default:
          console.log("what is " + message + "?");
          break;
      }
    });
  });
}


function mj(req, res) {
    var parallel = [],
        i = 0;

    while(i < 10000) {
        parallel.push(function(cb){
          if(paused) {
            while(!paused) {
              //do nothing;
            }
          }
          j.blend('load_user_by_id', {
            id: '5089b7302b503a0200000008'
          }, function(err, result) {
            //console.log(err, util.inspect(result, true, 100));
            //console.log("RESULT", result);
            cb(err, result);
            
          });
        });
        i++;
    }   
    var t = new Date().getTime();
    async.parallel(parallel, function(err, result){
      console.log(new Date().getTime() - t);
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Hello World\n');
    });
  }


// every interval, send sample data to the server

var allocations = {};
var snoitacolla = {};
function updateHeapDiff(diff) {
  var oldValue;
  var newValue;
  diff.change.details.forEach(function(data) {
    if (allocations[data.what] !== undefined) {
      oldValue = allocations[data.what];
      snoitacolla[oldValue].pop(snoitacolla[oldValue].indexOf(oldValue));
      if (!snoitacolla[oldValue].length) {
        delete snoitacolla[oldValue];
      }
    } else {
      oldValue = 0;
    }
    newValue = oldValue + data["+"] - data["-"];
    allocations[data.what] = newValue;
    if (!snoitacolla[newValue]) snoitacolla[newValue] = [];
    snoitacolla[newValue].push(data.what);
  });
}

function topHeapAllocations(howMany) {
  howMany = howMany || 6;
  var result = [];
  // annoyingly, we have to convert the keys to integers first
  var keys = [];
  Object.keys(snoitacolla).forEach(function(key) { keys.push(parseInt(key, 10)); });
  // sort greatest to least
  keys.sort(function(a,b) {return b-a;});

  keys.slice(0, howMany).forEach(function(key) {
    result.push([key, snoitacolla[key]]);
  });
  return result;
}

setInterval(function() {
  io.sockets.emit('temporal-sample', process.memoryUsage());
}, 333);

// and also emit post-gc stats
memwatch.on('stats', function(data) {
  if (data.type === 'inc') {
    io.sockets.emit('post-incremental-gc-sample', data);
  } else {
    if ((Date.now() - lastHD) > config.hdInterval) {
      updateHeapDiff(hd.end());
      hd = new memwatch.HeapDiff();
      lastHD = Date.now();
      io.sockets.emit('heap-allocations', topHeapAllocations());
    }
    io.sockets.emit('post-full-gc-sample', data);
  }
});