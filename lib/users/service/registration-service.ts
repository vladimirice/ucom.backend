import { injectable } from "inversify";
import "reflect-metadata";

import { IRegistrationService } from '../interfaces/di-interfaces';
import { StringToAnyCollection } from '../../common/interfaces/common-types';
import AuthValidator = require('../../auth/validators');
import { BadRequestError, JoiBadRequestError } from '../../api/errors';
import EosJsEcc = require('../../crypto/eosjs-ecc');
import EosApi = require('../../eos/eosApi');
import UsersRepository = require('../users-repository');
import UsersService = require('../users-service');
import AuthService = require('../../auth/authService');

const db = require('../../../models').sequelize;

@injectable()
class RegistrationService implements IRegistrationService {
  public async processRegistration(body: StringToAnyCollection) {
    const requestData = await this.checkRegistrationRequest(body);

    // #task - social key feature is a feature about completely removing a keys from the backend
    const newUserData = {
      account_name:         requestData.account_name,
      nickname:             requestData.account_name,
      created_at:           new Date(),
      updated_at:           new Date(),
      public_key:           requestData.public_key,
      private_key:          EosApi.getActivePrivateKeyByBrainkey(requestData.brainkey),
      owner_public_key:     EosApi.getOwnerPublicKeyByBrainKey(requestData.brainkey),
      is_tracking_allowed:  !!requestData.is_tracking_allowed || false,
    };

    const newUser = await db
      .transaction(async (transaction) => {
        const user = await UsersRepository.createNewUser(newUserData, transaction);

        await EosApi.transactionToCreateNewAccount(
          user.account_name,
          user.owner_public_key,
          user.public_key,
        );
        await UsersService.setBlockchainRegistrationIsSent(user, transaction);

        return user;
      });

    const token = AuthService.getNewJwtToken(newUser);

    return {
      token,
      user: newUser,
    };
  }

  /**
   *
   * @param {Object} body
   * @return {Promise<Object>}
   * @private
   */
  private async checkRegistrationRequest(body: StringToAnyCollection) {
    const { error, value:requestData } = AuthValidator.validateRegistration(body);

    if (error) {
      throw new JoiBadRequestError(error);
    }

    await AuthValidator.validateNewAccountName(requestData.account_name);

    if (!EosJsEcc.isValidPublic(requestData.public_key)) {
      throw new BadRequestError({
        public_key: 'Public key is not valid',
      });
    }

    // #task check is public key unique
    if (!EosJsEcc.verify(requestData.sign, requestData.account_name, requestData.public_key)) {
      throw new BadRequestError({
        account_name: 'sign is not valid',
      });
    }

    return requestData;
  }
}

export = RegistrationService;
