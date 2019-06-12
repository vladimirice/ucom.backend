"use strict";
class UosAccountsModelProvider {
    static uosAccountsPropertiesTableName() {
        return `blockchain.${this.uosAccountsPropertiesTableNameWithoutSchema()}`;
    }
    static uosAccountsPropertiesTableNameWithoutSchema() {
        return 'uos_accounts_properties';
    }
    static getFieldsToSelectWithEntityParams() {
        return this.getFieldsToSelect().concat(['entity_id', 'entity_name', 'account_name']);
    }
    static getFieldsToSelect() {
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
module.exports = UosAccountsModelProvider;
