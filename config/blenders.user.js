module.exports = {
    load_user_by_id: {
        required_fields: [
            'id'
        ],
        commands: [{
            key: 'user',
            db: 'find_user_by_id',
            params: {
                id: ':id'
            }
        }, {
            key: 'user2',
            db: 'find_user_by_id',
            params: {
                id: ':id'
            },
            next: [{
                key: 'user3',
                db: 'find_user_by_id',
                params: {
                    id: ':id'
                },
                next: [{
                    key: 'user4',
                    db: 'find_user_by_id',
                    params: {
                        id: ':id'
                    },
                    next: [{
                        key: 'user5',
                        db: 'find_user_by_id',
                        params: {
                            id: ':id'
                        }
                    }]
                }]
            }]
        }]
    }
};