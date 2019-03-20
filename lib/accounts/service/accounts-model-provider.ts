const ACCOUNTS_TABLE_NAME = 'accounts';
const ACCOUNTS_SYMBOLS_TABLE_NAME = 'accounts_symbols';

class AccountsModelProvider {
  public static accountsTableName(): string {
    return ACCOUNTS_TABLE_NAME;
  }

  public static accountsSymbolsTableName(): string {
    return ACCOUNTS_SYMBOLS_TABLE_NAME;
  }
}

export = AccountsModelProvider;
