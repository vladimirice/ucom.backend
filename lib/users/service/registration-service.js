"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const inversify_1 = require("inversify");
require("reflect-metadata");
const errors_1 = require("../../api/errors");
const AuthValidator = require("../../auth/validators");
const EosJsEcc = require("../../crypto/eosjs-ecc");
const EosApi = require("../../eos/eosApi");
const UsersRepository = require("../users-repository");
const UsersService = require("../users-service");
const AuthService = require("../../auth/authService");
const UsersCurrentParamsRepository = require("../repository/users-current-params-repository");
const db = require('../../../models').sequelize;
let RegistrationService = class RegistrationService {
    async processRegistration(body) {
        const requestData = await this.checkRegistrationRequest(body);
        // #task - social key feature is a feature about completely removing a keys from the backend
        const newUserData = {
            account_name: requestData.account_name,
            nickname: requestData.account_name,
            created_at: new Date(),
            updated_at: new Date(),
            public_key: requestData.public_key,
            private_key: EosApi.getActivePrivateKeyByBrainkey(requestData.brainkey),
            owner_public_key: EosApi.getOwnerPublicKeyByBrainKey(requestData.brainkey),
            is_tracking_allowed: !!requestData.is_tracking_allowed || false,
        };
        const newUser = await db
            .transaction(async (transaction) => {
            const user = await UsersRepository.createNewUser(newUserData, transaction);
            await EosApi.transactionToCreateNewAccount(user.account_name, user.owner_public_key, user.public_key);
            await UsersService.setBlockchainRegistrationIsSent(user, transaction);
            return user;
        });
        // #task - refactor upper code - use knex only and wrap this inside the transaction
        await UsersCurrentParamsRepository.insertRowForNewEntity(newUser.id);
        const token = AuthService.getNewJwtToken(newUser);
        return {
            token,
            user: newUser,
        };
    }
    // eslint-disable-next-line class-methods-use-this
    async checkRegistrationRequest(body) {
        const { error, value: requestData } = AuthValidator.validateRegistration(body);
        if (error) {
            throw new errors_1.JoiBadRequestError(error);
        }
        await AuthValidator.validateNewAccountName(requestData.account_name);
        if (!EosJsEcc.isValidPublic(requestData.public_key)) {
            throw new errors_1.BadRequestError({
                public_key: 'Public key is not valid',
            });
        }
        // #task check is public key unique
        if (!EosJsEcc.verify(requestData.sign, requestData.account_name, requestData.public_key)) {
            throw new errors_1.BadRequestError({
                account_name: 'sign is not valid',
            });
        }
        return requestData;
    }
};
RegistrationService = __decorate([
    inversify_1.injectable()
], RegistrationService);
module.exports = RegistrationService;
