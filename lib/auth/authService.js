const _ = require('lodash');
const jwt = require('jsonwebtoken');
const config = require('config');

const passportJWT = require("passport-jwt");
const ExtractJWT = passportJWT.ExtractJwt;

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
    const jwtData = jwt.verify(jwtToken, secretOrKey);

    return jwtData['id'];
  }
}

module.exports = AuthService;