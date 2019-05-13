"use strict";
const { UosAccountsPropertiesApi } = require('ucom-libs-wallet');
class UosAccountsPropertiesFetchService {
    static async getData(lowerBound, limit) {
        return UosAccountsPropertiesApi.getAccountsTableRows(lowerBound, limit);
    }
}
module.exports = UosAccountsPropertiesFetchService;
