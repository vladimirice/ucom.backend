"use strict";
const AuthValidator = require("../../../auth/validators");
const EosApi = require("../../../eos/eosApi");
const knex = require("../../../../config/knex");
const UsersRepository = require("../../users-repository");
const EosBlockchainStatusDictionary = require("../../../eos/eos-blockchain-status-dictionary");
const UsersCurrentParamsRepository = require("../../repository/users-current-params-repository");
class RegisterNewUserService {
    static async processRegistrationByAuthorization(accountName, givenSocialPublicKey, sign) {
        AuthValidator.validateAccountNameSyntax(accountName);
        const accountData = await AuthValidator.accountNameExistsInBlockchain(accountName);
        const { permissions } = accountData;
        const publicKeys = EosApi.getPublicKeysFromPermissions(permissions, accountName);
        AuthValidator.doesSocialKeyMatch(givenSocialPublicKey, publicKeys, accountName);
        await AuthValidator.areUsersWithGivenPublicKeys(publicKeys, accountName);
        AuthValidator.verifySignatureByPublicKey(sign, accountName, publicKeys.social);
        return this.processRegistration(accountName, publicKeys, false);
    }
    static async processRegistration(accountName, publicKeys, withBlockchain, isTrackingAllowed = false) {
        const newUserData = {
            account_name: accountName,
            nickname: accountName,
            created_at: new Date(),
            updated_at: new Date(),
            owner_public_key: publicKeys.owner,
            public_key: publicKeys.active,
            social_public_key: publicKeys.social,
            is_tracking_allowed: isTrackingAllowed,
            profile_updated_at: new Date(),
            private_key: null,
            blockchain_registration_status: EosBlockchainStatusDictionary.getStatusNew(),
        };
        if (!withBlockchain) {
            newUserData.blockchain_registration_status = EosBlockchainStatusDictionary.getStatusIsSent();
        }
        return knex.transaction(async (transaction) => {
            const user = await UsersRepository.createNewUser(newUserData, transaction);
            const promises = [
                UsersCurrentParamsRepository.insertRowForNewEntity(user.id, transaction),
            ];
            if (withBlockchain) {
                promises.push(EosApi.transactionToCreateNewAccount(accountName, publicKeys.owner, publicKeys.active), UsersRepository.setBlockchainRegistrationIsSent(user, transaction));
            }
            await Promise.all(promises);
            return user;
        });
    }
}
module.exports = RegisterNewUserService;
