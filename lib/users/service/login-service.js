"use strict";
const errors_1 = require("../../api/errors");
const AuthValidator = require("../../auth/validators");
const UsersService = require("../users-service");
const EosJsEcc = require("../../crypto/eosjs-ecc");
const AuthService = require("../../auth/authService");
const UsersModelProvider = require("../users-model-provider");
const knex = require("../../../config/knex");
const { SocialKeyApi } = require('ucom-libs-wallet');
class LoginService {
    static async logInUser(body) {
        const { error, value: requestData } = AuthValidator.validateLogin(body);
        if (error) {
            const messages = AuthValidator.formatErrorMessages(error.details);
            throw new errors_1.BadRequestError(messages);
        }
        const user = await UsersService.findOneByAccountName(requestData.account_name);
        if (!user) {
            throw new errors_1.BadRequestError([{
                    field: 'account_name',
                    message: 'Incorrect Brainkey or Account name',
                }]);
        }
        const socialPublicKey = await this.processSocialPublicKey(requestData, user);
        const publicKey = socialPublicKey || user.public_key;
        EosJsEcc.verifySignatureOrCommonError(requestData.sign, user.account_name, publicKey);
        const token = AuthService.getNewJwtToken(user);
        return {
            token,
            user,
            success: true,
        };
    }
    static async processSocialPublicKey(requestData, user) {
        const { social_public_key: socialPublicKeyFromRequest } = requestData;
        if (!socialPublicKeyFromRequest) {
            return null;
        }
        EosJsEcc.isValidPublicOrError(socialPublicKeyFromRequest);
        if (!user.social_public_key) {
            await this.checkGivenPublicSocialKey(user.account_name, socialPublicKeyFromRequest);
            await knex(UsersModelProvider.getTableName())
                .update({
                social_public_key: socialPublicKeyFromRequest,
            })
                .where({
                id: user.id,
            });
            return socialPublicKeyFromRequest;
        }
        if (socialPublicKeyFromRequest !== user.social_public_key) {
            throw new errors_1.BadRequestError(`User: ${user.account_name} has a different social public key: ${user.social_public_key}. Provided one: ${socialPublicKeyFromRequest}`);
        }
        return socialPublicKeyFromRequest;
    }
    static async checkGivenPublicSocialKey(accountName, givenPublicSocialKey) {
        const currentSocialKey = await SocialKeyApi.getAccountCurrentSocialKey(accountName);
        if (!currentSocialKey) {
            throw new errors_1.BadRequestError(`There is no social key for the user: ${accountName}. Bind it beforehand.`);
        }
        if (givenPublicSocialKey !== currentSocialKey) {
            throw new errors_1.BadRequestError(`User ${accountName} has different public social key: ${currentSocialKey}. Provided one is: ${givenPublicSocialKey}`);
        }
    }
}
module.exports = LoginService;
