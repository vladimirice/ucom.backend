"use strict";
const errors_1 = require("../../../api/errors");
class EosContentInputProcessor {
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
}
module.exports = EosContentInputProcessor;
