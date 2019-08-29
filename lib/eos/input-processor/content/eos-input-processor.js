"use strict";
const errors_1 = require("../../../api/errors");
class EosInputProcessor {
    static isSignedTransactionOrError(body) {
        if (!body.signed_transaction) {
            throw new errors_1.BadRequestError(errors_1.getErrorMessagePair('signed_transaction', 'Field signed_transaction is required'));
        }
    }
    static isBlockchainIdOrError(body) {
        if (!body.blockchain_id) {
            throw new errors_1.BadRequestError(errors_1.getErrorMessagePair('blockchain_id', 'Field blockchain_id is required'));
        }
    }
}
module.exports = EosInputProcessor;
