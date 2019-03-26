"use strict";
const USERS_EXTERNAL__TABLE_NAME = 'users_external';
const USERS_EXTERNAL_AUTH_LOG__TABLE_NAME = 'users_external_auth_log';
class UsersExternalModelProvider {
    static usersExternalTableName() {
        return USERS_EXTERNAL__TABLE_NAME;
    }
    static usersExternalAuthLogTableName() {
        return USERS_EXTERNAL_AUTH_LOG__TABLE_NAME;
    }
}
module.exports = UsersExternalModelProvider;
