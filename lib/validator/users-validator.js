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
};

class UsersValidator {
  static getFields() {
    return Object.keys(schema);
  }
}

module.exports = UsersValidator;