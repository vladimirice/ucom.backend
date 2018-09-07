/**
 * @deprecated - use Joi validators
 */
const { checkSchema } = require('express-validator/check');

const schema = {
  account_name: {
  },
  nickname: {
  },
  first_name: {
  },
  last_name: {
  },
  email: {
  },
  phone_number: {
  },
  birthday: {
  },
  about: {
  },
  country: {
  },
  city: {
  },
  address: {
  },
  mood_message: {
  },
  avatar_filename: {
  },
  public_key: {
  },
  currency_to_show: {
  },
  first_currency: {
  },
  first_currency_year: {
  },
  personal_website_url: {
  },
};

class UsersValidator {
  static getFields() {
    return Object.keys(schema);
  }
}

module.exports = UsersValidator;