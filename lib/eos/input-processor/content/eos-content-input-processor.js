"use strict";
const errors_1 = require("../../../api/errors");
const EosInputProcessor = require("./eos-input-processor");
class EosContentInputProcessor {
    static validateContentSignedTransactionDetailsOrError(body) {
        EosInputProcessor.isSignedTransactionOrError(body);
        EosInputProcessor.isBlockchainIdOrError(body);
    }
    static getSignedTransactionOrNull(body) {
        return body.signed_transaction || null;
    }
    static getSignedTransactionFromBody(body) {
        const { signed_transaction, blockchain_id } = body;
        if (!signed_transaction && !blockchain_id) {
            return null;
        }
        if (signed_transaction && !blockchain_id) {
            throw new errors_1.BadRequestError('If you provide a signed_transaction you must provide a content_id also.');
        }
        if (blockchain_id && !signed_transaction) {
            throw new errors_1.BadRequestError('If you provide a content_id you must provide a signed_transaction also.');
        }
        return {
            signed_transaction,
            blockchain_id,
        };
    }
    static areSignedTransactionUpdateDetailsOrError(body) {
        this.isSignedTransactionOrError(body);
    }
    static isSignedTransactionOrError(body) {
        if (!body.signed_transaction) {
            throw new errors_1.BadRequestError('Please provide a signed_transaction');
        }
    }
    static areSignedTransactionDetailsOrError(body) {
        if (!this.getSignedTransactionFromBody(body)) {
            throw new errors_1.BadRequestError('Please provide transaction details: blockchain_id and signed_transaction');
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
module.exports = EosContentInputProcessor;
