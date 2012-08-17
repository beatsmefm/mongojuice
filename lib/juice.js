var _           = require('underscore'),
    fs          = require('fs'),
    Blender     = require('./blender'),
    DB          = require('./db');

var Juicer = function(){};

Juicer.prototype.setup = function(config) {
    this.configDir = config.config_dir;
    this.blenders = {};
    this.db = {};
    this.klasses = {
        'blenders': Blender,
        'db': DB
    };
    this.loadConfig();
}

Juicer.prototype.loadConfig = function(){
    var files = fs.readdirSync(this.configDir);
    _.each(files, function(file){
        var matches = file.test(/(^([^\.])+\.([^\.])+\.config)/),
            configType = matches[1],
            modelType  = matches[2];
        var field = this[configType];
        if(field) {
            var klass = this.klasses[configType];
            field[modelType] = new klass();
        }
    }, this);
    this.validateConfig();
}

Juicer.prototype.validateConfig = function(){
    
}



module.exports = new Juicer();

module.exports.Juicer = Juicer;







