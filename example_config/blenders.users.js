module.exports = {
    update_user_email: {
        required_fields: ['id', 'email'],
        key: 'user',
        commands: [{
            db: 'update_user_email',
            params: {
                id: ':id',
                email: ':email'
            }
        }]
    },
    add_account_for_user: {
        required_fields: [
            'result', 
            'linked', 
            'external_id', 
            'user_id', 
            'display_name',
            'source'
        ],
        key: 'account',
        emits: [{
            name: 'add_account',
            params: {
                user_id: ':user_id'
            }
        }],
        commands: [{
            db: 'insert_account',
            params: {
                source: ':source',
                result: ':result',
                linked: ':linked',
                external_id: ':external_id',
                user_id: ':user_id',
                display_name: ':display_name'
            }
        }]
    },
    find_accounts_by_user: {
        cache: {
            set: true,
            hashkey: ['find_accounts_by_user', ':id'],
            resultkey: ['-descending', ':limit', ':account_skip'],
            clearon: [{
                name: 'add_account',
                params: {
                    user_id: ':id'
                }
            }]
        },
        commands: [{
            db: 'find_user_by_id',
            key: 'user',
            params: {
                id: ':id'
            },
            fields: ['email'],
            next: [{
                db: 'find_accounts_by_user_id',
                key: 'accounts',
                params: {
                    external_id: ':id'
                }
            }, {
                db: 'find_accounts_by_user_id',
                key: 'accounts2',
                params: {
                    external_id: ':id'
                }
            }]
        }]
    }
}