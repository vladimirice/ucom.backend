/* eslint-disable newline-per-chained-call */
/* tslint:disable:max-line-length */
import EosApi = require('../eos/eosApi');

const joi = require('joi');
const usersService = require('../users/users-service');

const { BadRequestError } = require('../../lib/api/errors');

class AuthValidator {
  static validateRegistration(req) {
    const schema = {
      account_name:           joi.string().min(1).max(255).required().label('Account name'),

      public_key:             joi.string().min(1).max(255).label('Public key'), // legacy
      active_public_key:      joi.string().min(1).max(255).label('Active public key'),
      owner_public_key:       joi.string().min(1).max(255).label('Owner public key'),
      social_public_key:      joi.string().min(1).max(255).label('Social public key'),

      sign:                   joi.string().min(1).max(255).required().label('Sign'),
      brainkey:               joi.string().min(1).max(255).label('Brainkey'), // legacy
      is_tracking_allowed:    joi.boolean().label('is_tracking_allowed').default(false),
    };

    return joi.validate(req, schema, {
      allowUnknown: true,
      stripUnknown: true,
      abortEarly:   false,
    });
  }

  static validateLogin(req) {
    const schema = {
      account_name:       joi.string().min(1).max(255).required().label('Account name'),
      public_key:         joi.string().min(1).max(255).label('Active public key'), // legacy
      social_public_key:  joi.string().min(1).max(255).label('Social public key'), // make required after the frontend feature
      sign:               joi.string().min(1).max(255).required().label('Sign'),
    };

    return joi.validate(req, schema, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
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

    if (!premiumAccounts.includes(accountName)
      && accountName.match(/^[1-5a-z]{12}$/) === null) {
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
    for (const element of errors) {
      const { key } = element.context;
      result.push({
        field: key,
        message: element.message.replace(/["']+/g, ''),
      });
    }

    return result;
  }
}

export = AuthValidator;
