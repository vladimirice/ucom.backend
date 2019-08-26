"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RegistrationService_1;
"use strict";
const inversify_1 = require("inversify");
require("reflect-metadata");
const errors_1 = require("../../api/errors");
const AuthValidator = require("../../auth/validators");
const EosJsEcc = require("../../crypto/eosjs-ecc");
const EosApi = require("../../eos/eosApi");
const UsersRepository = require("../users-repository");
const AuthService = require("../../auth/authService");
const UsersCurrentParamsRepository = require("../repository/users-current-params-repository");
const knex = require("../../../config/knex");
let RegistrationService = RegistrationService_1 = class RegistrationService {
    async processRegistration(body) {
        const requestData = await this.checkRegistrationRequest(body);
        const ownerPublicKey = requestData.owner_public_key || EosApi.getOwnerPublicKeyByBrainKey(requestData.brainkey);
        const activePublicKey = requestData.active_public_key || requestData.public_key;
        const newUserData = {
            account_name: requestData.account_name,
            nickname: requestData.account_name,
            created_at: new Date(),
            updated_at: new Date(),
            public_key: activePublicKey,
            owner_public_key: ownerPublicKey,
            is_tracking_allowed: !!requestData.is_tracking_allowed || false,
            profile_updated_at: new Date(),
            private_key: null,
        };
        const newUser = await knex.transaction(async (transaction) => {
            const user = await UsersRepository.createNewUser(newUserData, transaction);
            await Promise.all([
                EosApi.transactionToCreateNewAccount(newUserData.account_name, ownerPublicKey, activePublicKey),
                UsersRepository.setBlockchainRegistrationIsSent(user, transaction),
                UsersCurrentParamsRepository.insertRowForNewEntity(user.id, transaction),
            ]);
            return user;
        });
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
        RegistrationService_1.validatePublicKeys(requestData);
        RegistrationService_1.verifySignatureByPossibleKeys(requestData);
        await AuthValidator.validateNewAccountName(requestData.account_name);
        return requestData;
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
            RegistrationService_1.throwErrorIfPublicKeyIsInvalid(requestData[keyName]);
        }
    }
    static throwErrorIfPublicKeyIsInvalid(publicKey) {
        if (!EosJsEcc.isValidPublic(publicKey)) {
            throw new errors_1.BadRequestError({
                public_key: 'Public key is not valid',
            });
        }
    }
    static verifySignatureByPossibleKeys(requestData) {
        const publicKey = requestData.social_public_key || requestData.public_key;
        // #task check is public key unique
        if (!EosJsEcc.verify(requestData.sign, requestData.account_name, publicKey)) {
            throw new errors_1.BadRequestError({
                account_name: 'sign is not valid',
            });
        }
    }
};
RegistrationService = RegistrationService_1 = __decorate([
    inversify_1.injectable()
], RegistrationService);
module.exports = RegistrationService;
