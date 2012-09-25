==========


# Mongojuice
      
  Combining the caching power of redis with mongo.  This is to be able to configure all your queries, updates, saves, and cache those results as needed.  I'll be putting up more details, docs very soon.  
  
     var juicer = require('mongojuice');

     juicer.init({
        config_dir: './config/juice',
        db: {
            "username": "",
            "password": "",
            "host": "localhost",
            "port": 27017,
            "name": "database_name"
        },
        cache: {
            "url": 'localhost',
            "port": 6379,
            "password": "password"
        }
     }, function(err, connected){
        //do something or not
     });

You then add your models to mongoose in the following way:

     var schema = juicer.add('User', {
        username: { 
            type: String, 
            index: {
                unique: true,
                sparse: true
            },
            es_indexed: true
        },
        email: { 
            type: Email, 
            index: { 
                unique: true 
            }
        },
        password : { 
            type: String
        }
     }, { strict: true },
        [{
            username: 1
        }],
        { 
            plugin1: {},
            plugin2: {}
        }
     );

NOTE: Still in the deciding stage whether I'm going to keep mongoose in here or not.  It would be much faster to just go straight to the mongo driver, but mongoose has so many addons that are useful (like mongoosastic) that we can just inherit.  Mongojuice ultimately does not return a mongoose object, but does fire all the events.  This also only work with mongoose 3 and above, sorry non bleading edge folk:).  

Tests are still coming along.  

## Installation

    $ npm install mongojuice

## Quick Example

For now, I've included some examples in the example_config dir.  To summarize, you basically have two types of configuration, a blender config and a db config.  The former gives you the ability to combine db calls and the latter is for the db commands to execute for each mongo collection that you are working with.  

