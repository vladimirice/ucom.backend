const AIRDROPS_TABLE_NAME                             = 'airdrops';
const AIRDROPS_TOKENS_TABLE_NAME                      = 'airdrops_tokens';
const AIRDROPS_USERS_TABLE_NAME                       = 'airdrops_users';
const AIRDROPS_USERS_EXTERNAL_DATA_TABLE_NAME         = 'airdrops_users_external_data';

const AIRDROPS_USERS_GITHUB_RAW_TABLE_NAME            = 'airdrops_users_github_raw';
const AIRDROPS_USERS_GITHUB_RAW_ROUND_TWO_TABLE_NAME  = 'airdrops_users_github_raw_round_two';

class AirdropsModelProvider {
  public static airdropsUsersGithubRawTableName(): string {
    return AIRDROPS_USERS_GITHUB_RAW_TABLE_NAME;
  }

  public static airdropsUsersGithubRawRoundTwoTableName(): string {
    return AIRDROPS_USERS_GITHUB_RAW_ROUND_TWO_TABLE_NAME;
  }

  public static airdropsUsersExternalDataTableName(): string {
    return AIRDROPS_USERS_EXTERNAL_DATA_TABLE_NAME;
  }

  public static airdropsTableName(): string {
    return AIRDROPS_TABLE_NAME;
  }

  public static airdropsTokensTableName(): string {
    return AIRDROPS_TOKENS_TABLE_NAME;
  }

  public static airdropsUsersTableName(): string {
    return AIRDROPS_USERS_TABLE_NAME;
  }
}

export = AirdropsModelProvider;
