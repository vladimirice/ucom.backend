class UosAccountsModelProvider {
  public static uosAccountsPropertiesTableName(): string {
    return `blockchain.${this.uosAccountsPropertiesTableNameWithoutSchema()}`;
  }

  public static uosAccountsPropertiesTableNameWithoutSchema(): string {
    return 'uos_accounts_properties';
  }

  public static getFieldsToSelect(): string[] {
    return [
      'staked_balance',
      'validity',
      'importance',
      'scaled_importance',

      'stake_rate',
      'scaled_stake_rate',

      'social_rate',
      'scaled_social_rate',

      'transfer_rate',
      'scaled_transfer_rate',

      'previous_cumulative_emission',
      'current_emission',
      'current_cumulative_emission',
    ];
  }
}

export = UosAccountsModelProvider;
