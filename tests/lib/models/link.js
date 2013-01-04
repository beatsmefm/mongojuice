var j               = require('../../../index.js');

var urlValidator = function (val) {
  var reg = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  if (val && reg.test(val)) {
    return true;
  }
  return false;
};

var LinkSchema = {
  url: { 
    type: String,
    index: true,
    required: true,
    validate: [ urlValidator, 'Invalid URL.' ],
    es_indexed: true
  },
  title: {
    type: String,
    es_indexed: true,
    index: true
  },
  description: {
    type: String,
    es_indexed: true
  },
  source: {
    type: String,
    enum: [
      'soundcloud',
      'cratefm',
      'youtube',
      'vimeo',
      'mixcloud',
      'lastfm',
      'dailymotion'
    ],
    index: true,
    required: true,
    es_indexed: true
  },
  external_id: String,
  raw: { 
    type: Boolean, 
    default: false 
  },
  is_music: {
    type: Boolean,
    default: true
  },
  apiresult: {},
  last_post_date: { 
    type: Date, 
    default: Date.now 
  },
  creator_id: { type: String, required: true, index: true },
  poster_ids: { type: [String], index: true },
  create_date: { 
    type: Date, 
    default: Date.now,
    es_indexed: true,
    index: true
  },
  tags: {
    type: [
      {
        type: String,
        index: true,
      }
    ],
    es_indexed: true
  },
  favorited_users_count: {
      type: Number
  },
  favorited_users: {
      type: [String],
      index: true
  }
};

var schema = j.add('Link', LinkSchema, {}, [
  [ { source: 1, external_id: 1 }, { unique: true } ]
]);

