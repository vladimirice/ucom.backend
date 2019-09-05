"use strict";
const errors_1 = require("../api/errors");
class EosTransactionService {
    static getEosVersionBasedOnSignedTransaction(signedTransaction) {
        if (!signedTransaction) {
            throw new errors_1.AppError('Signed transaction must be determined');
        }
        return {
            eosJsV2: signedTransaction.includes('serializedTransaction'),
        };
    }
}
module.exports = EosTransactionService;
