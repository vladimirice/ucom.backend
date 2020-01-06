"use strict";
/* eslint-disable newline-per-chained-call */
/* tslint:disable:max-line-length */
const errors_1 = require("../api/errors");
const EosApi = require("../eos/eosApi");
const UsersService = require("../users/users-service");
const UsersRepository = require("../users/users-repository");
const EosJsEcc = require("../crypto/eosjs-ecc");
const { WalletApi } = require('ucom-libs-wallet');
const joi = require('joi');
const { BadRequestError } = require('../../lib/api/errors');
class AuthValidator {
    static validateRegistration(req) {
        const schema = {
            account_name: joi.string().min(1).max(255).required().label('Account name'),
            active_public_key: joi.string().min(1).max(255).label('Active public key'),
            owner_public_key: joi.string().min(1).max(255).label('Owner public key'),
            social_public_key: joi.string().min(1).max(255).label('Social public key'),
            sign: joi.string().min(1).max(255).required().label('Sign'),
            is_tracking_allowed: joi.boolean().label('is_tracking_allowed').default(false),
        };
        const { error, value } = joi.validate(req, schema, {
            allowUnknown: true,
            stripUnknown: true,
            abortEarly: false,
        });
        if (error) {
            throw new errors_1.JoiBadRequestError(error);
        }
        return value;
    }
    static validateLogin(req) {
        const schema = {
            account_name: joi.string().min(1).max(255).required().label('Account name'),
            public_key: joi.string().min(1).max(255).label('Active public key'),
            social_public_key: joi.string().min(1).max(255).label('Social public key'),
            sign: joi.string().min(1).max(255).required().label('Sign'),
        };
        return joi.validate(req, schema, {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true,
        });
    }
    static verifySignatureByPublicKey(sign, accountName, socialPublicKey) {
        if (!EosJsEcc.verify(sign, accountName, socialPublicKey)) {
            throw new BadRequestError({ account_name: 'sign is not valid' });
        }
    }
    static async areUsersWithGivenPublicKeys(publicKeys, accountName) {
        const publicKeysExist = await UsersRepository.areUsersWithGivenPublicKeys(publicKeys);
        if (publicKeysExist) {
            throw new BadRequestError(`Provided account ${accountName} has public keys which are already registered in the database`);
        }
    }
    static validateAccountNameSyntax(accountName) {
        if (accountName.match(/^[1-5a-z]{12}$/) === null) {
            throw new BadRequestError({
                account_name: 'Account name must contain only a-z or 1-5 and must have exactly 12 symbols length',
            });
        }
    }
    static async accountNameDoesNotExistInBackend(accountName) {
        const user = await UsersService.findOneByAccountName(accountName);
        if (user) {
            throw new BadRequestError({
                account_name: 'That account name is taken. Try another',
            });
        }
    }
    static async accountNameExistsInBlockchain(accountName) {
        const data = await WalletApi.getRawAccountData(accountName);
        if (data === null) {
            throw new BadRequestError(errors_1.getErrorMessagePair('account_name', 'Incorrect Brainkey or Account name'));
        }
        return data;
    }
    static doesSocialKeyMatch(givenSocialPublicKey, publicKeys, accountName) {
        if (givenSocialPublicKey !== publicKeys.social) {
            throw new BadRequestError(`Provided social key does not match one existing for the account: ${accountName}`);
        }
    }
    static async checkRegistrationRequest(body) {
        const requestData = AuthValidator.validateRegistration(body);
        this.validatePublicKeys(requestData);
        AuthValidator.verifySignatureByPublicKey(requestData.sign, requestData.account_name, requestData.social_public_key);
        await AuthValidator.validateNewAccountName(requestData.account_name);
        return requestData;
    }
    static async validateNewAccountName(accountName) {
        if (!accountName) {
            throw new BadRequestError({ account_name: 'Account name parameter is required' });
        }
        this.validateAccountNameSyntax(accountName);
        await this.accountNameDoesNotExistInBackend(accountName);
        if (!await EosApi.isAccountAvailable(accountName)) {
            throw new BadRequestError({
                account_name: 'That account name is taken. Try another',
            });
        }
        return true;
    }
    static formatErrorMessages(errors) {
        const result = [];
        for (const element of errors) {
            const { key } = element.context;
            result.push({
                field: key,
                message: element.message.replace(/["']+/g, ''),
            });
        }
        return result;
    }
    static validatePublicKeys(requestData) {
        // #backward compatibility
        const possibleKeys = [
            'public_key',
            'active_public_key',
            'owner_public_key',
            'social_public_key',
        ];
        for (const keyName of possibleKeys) {
            if (!requestData[keyName]) {
                continue;
            }
            this.throwErrorIfPublicKeyIsInvalid(requestData[keyName]);
        }
    }
    static throwErrorIfPublicKeyIsInvalid(publicKey) {
        if (!EosJsEcc.isValidPublic(publicKey)) {
            throw new BadRequestError({
                public_key: 'Public key is not valid',
            });
        }
    }
}
module.exports = AuthValidator;
