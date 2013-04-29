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
            },
            select: 'email'
        }
    }
};