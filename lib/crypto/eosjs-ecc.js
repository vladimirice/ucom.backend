"use strict";
const errors_1 = require("../api/errors");
const ecc = require('eosjs-ecc');
const prefixEos = 'EOS';
class EosJsEcc {
    static sign(data, privateKey) {
        return ecc.sign(data, privateKey);
    }
    static verify(signature, data, publicKey) {
        return ecc.verify(signature, data, EosJsEcc.getEosPrefixedPublicKey(publicKey));
    }
    static verifySignatureOrCommonError(signature, accountName, publicKey) {
        try {
            const verified = EosJsEcc.verify(signature, accountName, publicKey);
            if (!verified) {
                // noinspection ExceptionCaughtLocallyJS
                throw new errors_1.BadRequestError('error');
            }
        }
        catch (error) {
            throw new errors_1.BadRequestError(errors_1.getErrorMessagePair('account_name', 'Incorrect Brainkey or Account name or one of the private keys'));
        }
    }
    static isValidPublic(publicKey) {
        return ecc.isValidPublic(EosJsEcc.getEosPrefixedPublicKey(publicKey));
    }
    static isValidPublicOrError(publicKey) {
        if (!ecc.isValidPublic(publicKey)) {
            throw new errors_1.BadRequestError(errors_1.getErrorMessagePair('account_name', `Provided public key is not valid: ${publicKey}`));
        }
    }
    static getEosPrefixedPublicKey(publicKey) {
        // It is required because lib works only with EOS prefixed keys
        return prefixEos + publicKey.slice(3);
    }
}
module.exports = EosJsEcc;
