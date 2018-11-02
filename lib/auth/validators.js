const Joi = require('joi');
const UsersService = require('../users/users-service');

const { TransactionSender } = require('uos-app-transaction');
const { BadRequestError } = require('../../lib/api/errors');

class AuthValidator {
  static validateRegistration(req) {
    const schema = {
      account_name: Joi.string().min(1).max(255).required().label('Account name'),
      public_key: Joi.string().min(1).max(255).required().label('Public key'),
      sign: Joi.string().min(1).max(255).required().label('Sign'),
      brainkey: Joi.string().min(1).max(255).required().label('Brainkey'),
      is_tracking_allowed: Joi.boolean().label('is_tracking_allowed').default(false),
    };

    return Joi.validate(req, schema, {
      abortEarly: false
    });
  }

  static validateLogin(req) {
    const schema = {
      account_name: Joi.string().min(1).max(255).required().label('Account name'),
      public_key: Joi.string().min(1).max(255).required().label('Public key'),
      sign: Joi.string().min(1).max(255).required().label('Sign'),
    };

    return Joi.validate(req, schema, {
      abortEarly: false
    });
  }

  /**
   *
   * @param {string} account_name
   * @return {Promise<boolean>}
   */
  static async validateNewAccountName(account_name) {
    // TODO #refactor - Custom Error
    if (!account_name) {
      throw new BadRequestError({
        account_name: 'Account name parameter is required'
      });
    }

    // TODO - only for MVP in order to avoid questions
    const premiumAccounts = [
      'vlad', 'jane'
    ];

    if (premiumAccounts.indexOf(account_name) === -1
      && account_name.match(/^[a-z1-5]{12}$/) === null) {

      throw new BadRequestError({
        account_name: 'Account name must contain only a-z or 1-5 and must have exactly 12 symbols length'
      });
    }

    const user = await UsersService.findOneByAccountName(account_name);
    if (user) {
      throw new BadRequestError({
        account_name: 'That account name is taken. Try another'
      });
    }

    if (!await TransactionSender.isAccountAvailable(account_name)) {
      throw new BadRequestError({
        account_name: 'That account name is taken. Try another'
      });
    }

    return true;
  }

  static formatErrorMessages(errors) {
    let result = [];
    for(let i = 0; i < errors.length; i++) {
      let key = errors[i].context.key;
      result.push({
        field: key,
        message: errors[i].message.replace(/['"]+/g, '')
      });
    }

    return result;
  }
}

module.exports = AuthValidator;