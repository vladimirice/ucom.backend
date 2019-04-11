"use strict";
const { BackendApi } = require('ucom-libs-wallet');
class AirdropsFetchTableRowsService {
    static async getAirdropsReceiptTableRowsAfterExternalId(externalId) {
        return BackendApi.getAirdropsReceiptTableRowsAfterExternalId(externalId);
    }
}
module.exports = AirdropsFetchTableRowsService;
