const Joi = require('joi');


class AuthValidator {
  static validateReg(req) {
    const schema = {
      account_name: Joi.string().min(1).max(255).required().label('Account name'),
      public_key: Joi.string().min(1).max(255).required().label('Public key'),
      sign: Joi.string().min(1).max(255).required().label('Sign'),
      brainkey: Joi.string().min(1).max(255).required().label('Brainkey'),
    };

    return Joi.validate(req, schema, {
      abortEarly: false
    });
  }


  static validateRegistration(req) {
    const schema = {
      account_name: Joi.string().min(1).max(255).required().label('Account name'),
      public_key: Joi.string().min(1).max(255).required().label('Public key'),
      sign: Joi.string().min(1).max(255).required().label('Sign'),
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
        message: errors[i].message.replace(/['"]+/g, '')
      });
    }

    return result;
  }
}

module.exports = AuthValidator;