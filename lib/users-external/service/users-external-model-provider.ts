const USERS_EXTERNAL__TABLE_NAME          = 'users_external';
const USERS_EXTERNAL_AUTH_LOG__TABLE_NAME = 'users_external_auth_log';

class UsersExternalModelProvider {
  public static usersExternalTableName(): string {
    return USERS_EXTERNAL__TABLE_NAME;
  }

  public static usersExternalAuthLogTableName(): string {
    return USERS_EXTERNAL_AUTH_LOG__TABLE_NAME;
  }
}

export = UsersExternalModelProvider;
