class UosAccountsModelProvider {
  public static uosAccountsPropertiesTableName(): string {
    return `blockchain.${this.uosAccountsPropertiesTableNameWithoutSchema()}`;
  }

  public static uosAccountsPropertiesTableNameWithoutSchema(): string {
    return 'uos_accounts_properties';
  }
}

export = UosAccountsModelProvider;
