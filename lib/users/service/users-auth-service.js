const AuthService   = require('../../../lib/auth/authService');
const AuthValidator = require('../../../lib/auth/validators');

const { BadRequestError, JoiBadRequestError } = require('../../../lib/api/errors');

const EosJsEcc = require('../../../lib/crypto/eosjs-ecc');
const EosApi = require('../../../lib/eos/eosApi');
const UsersService = require('../../../lib/users/users-service');

const UsersRepository = require('../repository').Main;

const db = require('../../../models').sequelize;

class UsersAuthService {

  /**
   *
   * @param {Object} body
   * @return {Promise<*>}
   */
  static async processNewUserRegistration(body) {
    const requestData = await this._checkRegistrationRequest(body);

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
      .transaction(async transaction => {
        const newUser = await UsersRepository.createNewUser(newUserData, transaction);

        await EosApi.transactionToCreateNewAccount(newUser.account_name, newUser.owner_public_key, newUser.public_key);
        await UsersService.setBlockchainRegistrationIsSent(newUser, transaction);

        return newUser;
    });

    const token = AuthService.getNewJwtToken(newUser);

    return {
      token,
      user: newUser
    };
  }

  /**
   *
   * @param {Object} body
   * @return {Promise<Object>}
   * @private
   */
  static async _checkRegistrationRequest(body) {
    const { error, value:requestData } = AuthValidator.validateRegistration(body);

    if (error) {
      throw new JoiBadRequestError(error);
    }

    await AuthValidator.validateNewAccountName(requestData.account_name);

    if (!EosJsEcc.isValidPublic(requestData.public_key)) {
      throw new BadRequestError({
        'public_key': 'Public key is not valid',
      });
    }

    // TODO check is public key unique
    if (!EosJsEcc.verify(requestData.sign, requestData.account_name, requestData.public_key)) {
      throw new BadRequestError({
        'account_name': 'sign is not valid',
      });
    }

    return requestData;
  }
}

module.exports = UsersAuthService;