const ACCOUNTS_TABLE_NAME = 'accounts';
const ACCOUNTS_SYMBOLS_TABLE_NAME = 'accounts_symbols';
const ACCOUNTS_TRANSACTIONS_TABLE_NAME = 'accounts_transactions';

class AccountsModelProvider {
  public static accountsTransactionsTableName(): string {
    return ACCOUNTS_TRANSACTIONS_TABLE_NAME;
  }

  public static accountsTableName(): string {
    return ACCOUNTS_TABLE_NAME;
  }

  public static accountsSymbolsTableName(): string {
    return ACCOUNTS_SYMBOLS_TABLE_NAME;
  }
}

export = AccountsModelProvider;
