import EnvHelper = require('../../common/helper/env-helper');

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

  public static getUsersExternalDataBlacklistedIds(): number[] {
    if (EnvHelper.isStagingEnv()) {
      return [1, 2, 25, 3, 4, 12, 13, 20, 22, 23, 27, 28, 29, 32, 33, 36, 39, 45, 42, 49, 43, 46, 44, 47, 53, 52, 51, 54, 56, 57, 66, 59, 60, 61, 68, 64, 65, 69, 70, 76, 75, 78, 80];
    }

    return [];
  }

  public static getHardcodedCurrencyPrecision(): number {
    return 10 ** 4;
  }
}

export = AirdropsModelProvider;
