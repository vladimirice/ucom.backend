"use strict";
const errors_1 = require("../../../api/errors");
const EosApi = require("../../eosApi");
class EosInputProcessor {
    static async processWithIsMultiSignatureForCreation(body, accountNameField, isMultiSignature) {
        EosInputProcessor.isBlockchainIdOrError(body);
        if (isMultiSignature) {
            EosInputProcessor.isNotSignedTransactionOrError(body);
            const doesExist = await EosApi.doesAccountExist(body[accountNameField]);
            if (!doesExist) {
                throw new errors_1.BadRequestError(`There is no such account in the blockchain: ${body[accountNameField]}`);
            }
        }
        else {
            EosInputProcessor.isSignedTransactionOrError(body);
        }
        return body.signed_transaction || '';
    }
    static isSignedTransactionOrError(body) {
        if (!body.signed_transaction) {
            throw new errors_1.BadRequestError(errors_1.getErrorMessagePair('signed_transaction', 'Field signed_transaction is required'));
        }
    }
    static isNotSignedTransactionOrError(body) {
        if (typeof body.signed_transaction !== 'undefined') {
            throw new errors_1.BadRequestError('If is_multi_signature = true then signed_transaction must not be set. Sign everything on frontend.');
        }
    }
    static isBlockchainIdOrError(body) {
        if (!body.blockchain_id) {
            throw new errors_1.BadRequestError(errors_1.getErrorMessagePair('blockchain_id', 'Field blockchain_id is required'));
        }
    }
}
module.exports = EosInputProcessor;
