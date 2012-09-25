module.exports = {
    find_accounts_by_user_id: {
        model: 'Account',
        params: {
            external_id: {
                required: true
            }
        },
        dbcall: {
            find: {
                external_id: ':external_id'
            }
        }
    }
}