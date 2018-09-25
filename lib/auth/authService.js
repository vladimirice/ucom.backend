const _ = require('lodash');
const jwt = require('jsonwebtoken');
const config = require('config');

const passportJWT = require('passport-jwt');
const ExtractJWT = passportJWT.ExtractJwt;

const { AppError } = require('../api/errors');

class AuthService {
  static getNewJwtToken(user) {
    return jwt.sign(_.pick(user, ['id', 'account_name']), config.get('auth').jwt_secret_key)
  }

  static extractCurrentUserByToken(req) {
    const jwtToken = ExtractJWT.fromAuthHeaderAsBearerToken()(req);

    if (!jwtToken) {
      return;
    }

    const secretOrKey = config.get('auth')['jwt_secret_key'];

    try {
      const jwtData = jwt.verify(jwtToken, secretOrKey);
      return jwtData.id;
    } catch (err) {
      if (err.message === 'invalid signature') {
        throw new AppError('Auth is required', 401);
      }

      throw err;
    }
  }
}

module.exports = AuthService;