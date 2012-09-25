module.exports = {
    find_user_by_id: {
        model: 'User',
        params: {
            id: {
                required: true
            }
        },
        dbcall: {
            findOne: {
                _id: ':id'
            }
        }
    },
    update_user_email: {
        model: 'User',
        params: {
            id: {
                required: true
            },
            email: {
                required: true
            }
        },
        dbcall: {
            findOneAndUpdate: [
                { _id: ':id' }, 
                { $set: {
                    email: ':email'
                }}
            ]
        }
    },
    insert_account: {
        model: 'Account',
        params: {
            result: {
                required: true
            },
            source: {
                required: true
            },
            linked: {
                required: true
            },
            external_id: {
                required: true
            },
            user_id: {
                required: true
            },
            display_name: {
                required: true
            }
        },
        dbcall: 'save'
    },
    update_account: {
        model: 'Account',
        params: {
            display_name: { required: true },
            user_id: { required: true }
        },
        dbcall: {
            update: [{
                user_id: ':user_id'
            }, {
                $set: {
                    display_name: ':display_name'
                }
            }]
        }
    }
}