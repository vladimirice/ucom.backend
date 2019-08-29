"use strict";
const errors_1 = require("../../../api/errors");
const EosContentInputProcessor = require("./eos-content-input-processor");
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
    static addSignedTransactionDetailsFromRequest(body) {
        const transactionDetails = EosContentInputProcessor.getSignedTransactionFromBody(body);
        if (transactionDetails === null) {
            return false;
        }
        body.blockchain_id = transactionDetails.blockchain_id;
        body.signed_transaction = transactionDetails.signed_transaction;
        return true;
    }
}
module.exports = EosInputProcessor;
