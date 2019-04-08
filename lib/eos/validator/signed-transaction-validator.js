"use strict";
const errors_1 = require("../../api/errors");
class SignedTransactionValidator {
    static validateBodyWithBadRequestError(body) {
        if (this.validateItSelf(body.signed_transaction)) {
            return;
        }
        throw new errors_1.BadRequestError(`There is no signed_transaction string field in body or it is malformed. Provided body is: ${JSON.stringify(body)}`, 400);
    }
    static validateItSelf(signedTransaction) {
        return typeof signedTransaction === 'string'
            && signedTransaction.length > 0;
    }
}
module.exports = SignedTransactionValidator;
