const _ = require('lodash');
const jwt = require('jsonwebtoken');
const config = require('config');

let currentUser;

class AuthService {
  static getNewJwtToken(user) {
    return jwt.sign(_.pick(user, ['id', 'account_name']), config.get('auth').jwt_secret_key)
  }

  static setCurrentUser() {

  }

  static getCurrentUser() {

  }
}

module.exports = AuthService;