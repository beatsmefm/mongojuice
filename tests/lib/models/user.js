var j               = require('../../../index.js');

var Email          = j.schemaTypes().Email,
    Url            = j.schemaTypes().Url;


var UserSchema = {
    username: { 
        type: String, 
        index: {
            unique: true,
            sparse: true
        },
        es_indexed: true
    },
    displayname: {
        type: String, 
        index: {
            unique: true,
            sparse: true
        },
        es_indexed: true
    },
    email: { 
        type: Email, 
        required: true,
        index: { 
            unique: true 
        }
    },
    admin: Boolean,
    show_bm: { type: Boolean, default: true },
    explorer_image_url: Url,
    detail_image_url: Url,
    password : { 
        type: String
    },
    salt: String,
    location: String,
    forgot_password_hash: String,
    create_date: {
        type: Date, 
        default: Date.now,
        es_indexed: true,
        index: true
    },
    update_date: Date,
    last_login_date: { 
        type: Date, 
        default: Date.now 
    },
    sneakpeek: Boolean,
    verify_hash: String,
    verify_date: {
      type: Date,
      hide: true
    },
    invite_code_request_date: {
        type: Date
    },
    invite_code: {
        type: String,
        index: true
    },
    invited: {
        type: Boolean,
        default: false
    },
    accepted_invite_date: {
        type: Date
    },
    follower_count: { 
        type: Number
    },
    followed_user_ids: {
        type: [String],
        index: true
    },
    crate_count: {
        type: Number
    },
    social_account_ids: {
        type: [String]
    },
    link_ids: {
        type: [String]
    },
    description: {
        type: String
    },
    confirmed: {
        type: Boolean,
        default: false,
        index: true,
        es_indexed: true
    }
};

var schema = j.add('User', UserSchema, {}, [
    { _id: 1, confirmed: 1 },
    { followed_user_ids: 1, confirmed: 1 },
    { email: 1, confirmed: 1 },
    { username: 1, confirmed: 1 }
]);


