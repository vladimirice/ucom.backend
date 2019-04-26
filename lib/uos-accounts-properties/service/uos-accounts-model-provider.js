"use strict";
class UosAccountsModelProvider {
    static uosAccountsPropertiesTableName() {
        return `blockchain.${this.uosAccountsPropertiesTableNameWithoutSchema()}`;
    }
    static uosAccountsPropertiesTableNameWithoutSchema() {
        return 'uos_accounts_properties';
    }
}
module.exports = UosAccountsModelProvider;
