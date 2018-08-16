const Joi = require('joi');


class AuthValidator {
  static validateRegistration(req) {
    const schema = {
      account_name: Joi.string().min(1).max(255).required(),
      public_key: Joi.string().min(1).max(255).required(),
      sign: Joi.string().min(1).max(255).required()
    };

    return Joi.validate(req, schema, {
      abortEarly: false
    });
  }

  static formatErrorMessages(errors) {
    let result = [];
    for(let i = 0; i < errors.length; i++) {
      let key = errors[i].context.key;
      result.push({
        field: key,
        message: errors[i].message
      });
    }

    return result;
  }
}

module.exports = AuthValidator;