import { Transaction } from 'knex';
import { UserModel } from '../../interfaces/model-interfaces';
import { IPublicKeys } from '../../../auth/interfaces/auth-interfaces-dto';

import AuthValidator = require('../../../auth/validators');
import EosApi = require('../../../eos/eosApi');
import knex = require('../../../../config/knex');
import UsersRepository = require('../../users-repository');
import EosBlockchainStatusDictionary = require('../../../eos/eos-blockchain-status-dictionary');
import UsersCurrentParamsRepository = require('../../repository/users-current-params-repository');

class RegisterNewUserService {
  public static async processRegistrationByAuthorization(
    accountName: string, givenSocialPublicKey: string, sign: string,
  ): Promise<UserModel> {
    AuthValidator.validateAccountNameSyntax(accountName);

    const accountData = await AuthValidator.accountNameExistsInBlockchain(accountName);

    const { permissions } = accountData;

    const publicKeys = EosApi.getPublicKeysFromPermissions(permissions, accountName);

    AuthValidator.doesSocialKeyMatch(givenSocialPublicKey, publicKeys, accountName);

    await AuthValidator.areUsersWithGivenPublicKeys(publicKeys, accountName);

    AuthValidator.verifySignatureByPublicKey(sign, accountName, publicKeys.social);

    return this.processRegistration(accountName, publicKeys, false);
  }

  public static async processRegistration(
    accountName: string, publicKeys: IPublicKeys, withBlockchain: boolean, isTrackingAllowed: boolean = false,
  ): Promise<UserModel> {
    const newUserData = {
      account_name:         accountName,
      nickname:             accountName,
      created_at:           new Date(),
      updated_at:           new Date(),

      owner_public_key:     publicKeys.owner,
      public_key:           publicKeys.active,
      social_public_key:    publicKeys.social,

      is_tracking_allowed:  isTrackingAllowed,

      profile_updated_at:   new Date(),

      private_key:          null,
      blockchain_registration_status: EosBlockchainStatusDictionary.getStatusNew(),
    };

    if (!withBlockchain) {
      newUserData.blockchain_registration_status = EosBlockchainStatusDictionary.getStatusIsSent();
    }

    return knex.transaction(async (transaction: Transaction) => {
      const user: UserModel = await UsersRepository.createNewUser(newUserData, transaction);

      const promises = [
        UsersCurrentParamsRepository.insertRowForNewEntity(user.id, transaction),
      ];

      if (withBlockchain) {
        promises.push(
          EosApi.transactionToCreateNewAccount(accountName, publicKeys.owner, publicKeys.active),
          UsersRepository.setBlockchainRegistrationIsSent(user, transaction),
        );
      }

      await Promise.all(promises);

      return user;
    });
  }
}

export = RegisterNewUserService;
