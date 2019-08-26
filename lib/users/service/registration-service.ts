import { injectable } from 'inversify';
import 'reflect-metadata';

import { Transaction } from 'knex';
import { IRequestBody } from '../../common/interfaces/common-types';
import { BadRequestError, JoiBadRequestError } from '../../api/errors';
import { UserModel } from '../interfaces/model-interfaces';

import AuthValidator = require('../../auth/validators');
import EosJsEcc = require('../../crypto/eosjs-ecc');
import EosApi = require('../../eos/eosApi');
import UsersRepository = require('../users-repository');
import AuthService = require('../../auth/authService');
import UsersCurrentParamsRepository = require('../repository/users-current-params-repository');
import knex = require('../../../config/knex');

@injectable()
class RegistrationService {
  public async processRegistration(body: IRequestBody): Promise<{ token: string, user: UserModel }> {
    const requestData = await this.checkRegistrationRequest(body);

    const ownerPublicKey  = requestData.owner_public_key || EosApi.getOwnerPublicKeyByBrainKey(requestData.brainkey);
    const activePublicKey = requestData.active_public_key || requestData.public_key;

    const newUserData = {
      account_name:         requestData.account_name,
      nickname:             requestData.account_name,
      created_at:           new Date(),
      updated_at:           new Date(),

      public_key:           activePublicKey,
      owner_public_key:     ownerPublicKey,
      is_tracking_allowed:  !!requestData.is_tracking_allowed || false,

      profile_updated_at:   new Date(),

      private_key:          null,
    };

    const newUser = await knex.transaction(async (transaction: Transaction) => {
      const user: UserModel = await UsersRepository.createNewUser(newUserData, transaction);

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
  private async checkRegistrationRequest(body: IRequestBody) {
    const { error, value:requestData } = AuthValidator.validateRegistration(body);

    if (error) {
      throw new JoiBadRequestError(error);
    }

    RegistrationService.validatePublicKeys(requestData);
    RegistrationService.verifySignatureByPossibleKeys(requestData);

    await AuthValidator.validateNewAccountName(requestData.account_name);

    return requestData;
  }

  private static validatePublicKeys(requestData) {
    // #backward compatibility
    const possibleKeys = [
      'public_key', // legacy
      'active_public_key',
      'owner_public_key',
      'social_public_key',
    ];

    for (const keyName of possibleKeys) {
      if (!requestData[keyName]) {
        continue;
      }

      RegistrationService.throwErrorIfPublicKeyIsInvalid(requestData[keyName]);
    }
  }

  private static throwErrorIfPublicKeyIsInvalid(publicKey: string): void {
    if (!EosJsEcc.isValidPublic(publicKey)) {
      throw new BadRequestError({
        public_key: 'Public key is not valid',
      });
    }
  }

  private static verifySignatureByPossibleKeys(requestData): void {
    const publicKey: string = requestData.social_public_key ||  requestData.public_key;

    // #task check is public key unique
    if (!EosJsEcc.verify(requestData.sign, requestData.account_name, publicKey)) {
      throw new BadRequestError({
        account_name: 'sign is not valid',
      });
    }
  }
}

export = RegistrationService;
