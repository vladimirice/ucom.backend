import { IRequestBody } from '../../common/interfaces/common-types';
import { BadRequestError } from '../../api/errors';
import { UserModel } from '../interfaces/model-interfaces';

import AuthValidator = require('../../auth/validators');
import UsersService = require('../users-service');
import EosJsEcc = require('../../crypto/eosjs-ecc');
import AuthService = require('../../auth/authService');
import UsersModelProvider = require('../users-model-provider');
import knex = require('../../../config/knex');

const { SocialKeyApi } = require('ucom-libs-wallet');

class LoginService {
  public static async logInUser(body: IRequestBody) {
    const { error, value: requestData } = AuthValidator.validateLogin(body);
    if (error) {
      const messages = AuthValidator.formatErrorMessages(error.details);

      throw new BadRequestError(messages);
    }

    const user = await UsersService.findOneByAccountName(requestData.account_name);

    if (!user) {
      throw new BadRequestError([{
        field: 'account_name',
        message: 'Incorrect Brainkey or Account name',
      }]);
    }

    const socialPublicKey: string | null = await this.processSocialPublicKey(requestData, user);

    const publicKey = socialPublicKey || user.public_key;

    EosJsEcc.verifySignatureOrCommonError(requestData.sign, user.account_name, publicKey);

    const token = AuthService.getNewJwtToken(user);

    return {
      token,
      user,
      success: true,
    };
  }

  private static async processSocialPublicKey(
    requestData: IRequestBody,
    user: UserModel,
  ): Promise<string | null> {
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
        })
      ;

      return socialPublicKeyFromRequest;
    }

    if (socialPublicKeyFromRequest !== user.social_public_key) {
      throw new BadRequestError(`User: ${user.account_name} has a different social public key: ${user.social_public_key}. Provided one: ${socialPublicKeyFromRequest}`);
    }

    return socialPublicKeyFromRequest;
  }

  private static async checkGivenPublicSocialKey(accountName: string, givenPublicSocialKey: string): Promise<void> {
    const currentSocialKey = await SocialKeyApi.getAccountCurrentSocialKey(accountName);

    if (!currentSocialKey) {
      throw new BadRequestError(`There is no social key for the user: ${accountName}. Bind it beforehand.`);
    }

    if (givenPublicSocialKey !== currentSocialKey) {
      throw new BadRequestError(`User ${accountName} has different public social key: ${currentSocialKey}. Provided one is: ${givenPublicSocialKey}`);
    }
  }
}

export = LoginService;
