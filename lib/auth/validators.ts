/* tslint:disable:max-line-length */
import EosApi = require('../eos/eosApi');

const joi = require('joi');
const usersService = require('../users/users-service');

const { BadRequestError } = require('../../lib/api/errors');

class AuthValidator {
  static validateRegistration(req) {
    const schema = {
      account_name:         joi.string().min(1).max(255).required().label('Account name'),
      public_key:           joi.string().min(1).max(255).required().label('Public key'),
      sign:                 joi.string().min(1).max(255).required().label('Sign'),
      brainkey:             joi.string().min(1).max(255).required().label('Brainkey'),
      is_tracking_allowed:  joi.boolean().label('is_tracking_allowed').default(false),
    };

    return joi.validate(req, schema, {
      abortEarly: false,
    });
  }

  static validateLogin(req) {
    const schema = {
      account_name: joi.string().min(1).max(255).required().label('Account name'),
      public_key: joi.string().min(1).max(255).required().label('Public key'),
      sign: joi.string().min(1).max(255).required().label('Sign'),
    };

    return joi.validate(req, schema, {
      abortEarly: false,
    });
  }

  /**
   *
   * @param {string} accountName
   * @return {Promise<boolean>}
   */
  static async validateNewAccountName(accountName) {
    // #refactor - Custom Error
    if (!accountName) {
      throw new BadRequestError({
        account_name: 'Account name parameter is required',
      });
    }

    // #task - only for MVP in order to avoid questions
    const premiumAccounts = [
      'vlad', 'jane',
    ];

    if (premiumAccounts.indexOf(accountName) === -1
      && accountName.match(/^[a-z1-5]{12}$/) === null) {

      throw new BadRequestError({
        account_name: 'Account name must contain only a-z or 1-5 and must have exactly 12 symbols length',
      });
    }

    const user = await usersService.findOneByAccountName(accountName);
    if (user) {
      throw new BadRequestError({
        account_name: 'That account name is taken. Try another',
      });
    }

    if (!await EosApi.isAccountAvailable(accountName)) {
      throw new BadRequestError({
        account_name: 'That account name is taken. Try another',
      });
    }

    return true;
  }

  static formatErrorMessages(errors) {
    const result: any = [];
    for (let i = 0; i < errors.length; i += 1) {
      const key = errors[i].context.key;
      result.push({
        field: key,
        message: errors[i].message.replace(/['"]+/g, ''),
      });
    }

    return result;
  }
}

export = AuthValidator;
