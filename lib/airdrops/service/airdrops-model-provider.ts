const AIRDROPS_TABLE_NAME = 'airdrops';
const AIRDROPS_TOKENS_TABLE_NAME = 'airdrops_tokens';

class AirdropsModelProvider {
  public static airdropsTableName(): string {
    return AIRDROPS_TABLE_NAME;
  }

  public static airdropsTokensTableName(): string {
    return AIRDROPS_TOKENS_TABLE_NAME;
  }
}

export = AirdropsModelProvider;
