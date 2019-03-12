import { BadRequestError } from '../api/errors';

import moment = require('moment');

const _ = require('lodash');
const jwt = require('jsonwebtoken');
const config = require('config');

const authConfig = config.get('auth');

const passportJWT = require('passport-jwt');

const extractJWT = passportJWT.ExtractJwt;

const { AppError } = require('../api/errors');

class AuthService {
  public static getNewJwtToken(user): string {
    return jwt.sign(_.pick(user, ['id', 'account_name']), config.get('auth').jwt_secret_key);
  }

  public static getNewGithubAuthToken(externalUsersId: number, expirationInDays: number): string {
    const toSign = {
      externalUsersId,
    };

    this.addExpiredAt(toSign, expirationInDays);

    return jwt.sign(toSign, authConfig.jwt_secret_key);
  }

  /**
   *
   * @param {string} jwtToken
   * @return {number}
   */
  static extractCurrentUserIdByTokenOrError(jwtToken) {
    const secretOrKey = config.get('auth').jwt_secret_key;

    try {
      const jwtData = jwt.verify(jwtToken, secretOrKey);
      return +jwtData.id;
    } catch (err) {
      if (err.message === 'invalid signature') {
        throw new AppError('Auth is required', 401);
      }

      throw err;
    }
  }

  public static extractUsersExternalIdByTokenOrError(jwtToken: string): number {
    try {
      const jwtData = jwt.verify(jwtToken, authConfig.jwt_secret_key);

      this.exceptionIfExpired(jwtData);

      return +jwtData.externalUsersId;
    } catch (err) {
      if (err.message === 'invalid signature') {
        throw new AppError('Provided token is not valid', 401);
      }

      throw err;
    }
  }

  static extractCurrentUserByToken(req): number | null {
    const jwtToken = extractJWT.fromAuthHeaderAsBearerToken()(req);

    if (!jwtToken) {
      return null;
    }

    const secretOrKey = config.get('auth').jwt_secret_key;

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

  private static addExpiredAt(toSign, expirationInDays: number): void {
    toSign.expiredAt = moment().add(expirationInDays, 'days').utc().format();
  }

  private static exceptionIfExpired(jwtData): void {
    if (!jwtData.expiredAt) {
      throw new BadRequestError('Malformed token - expiredAt field is required');
    }

    const expiredAt = moment(jwtData.expiredAt);
    const now = moment();
    if (now > expiredAt) {
      throw new BadRequestError('Token is expired', 401);
    }
  }
}

export = AuthService;
