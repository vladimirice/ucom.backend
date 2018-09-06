const usersSeeds = require('../../../seeders/users/users');
const eosAccounts = require('../../../seeders/users/eos_accounts');
const AuthService = require('../../../lib/auth/authService');
const UsersRepository = require('../../../lib/users/users-repository');
const ResponseHelper = require('../helpers/response-helper');
const EosImportance = require('../../../lib/eos/eos-importance');
const request = require('supertest');
const server = require('../../../app');


require('jest-expect-message');

class UsersHelper {

  /**
   * @param {Object} actual
   */
  static checkShortUserInfoResponse(actual) {
    UsersRepository.getModel().shortUserInfoFields().forEach(field => {
      expect(actual[field], `There is no field ${field}`).toBeDefined();
    });
  }

  static async setSampleRateToUserVlad() {
    const rateToSet = 0.1234;

    const vladFromDb = await UsersRepository.getUserByAccountName('vlad');

    await vladFromDb.update({
      'current_rate': rateToSet
    });

    const rateNormalized = EosImportance.getImportanceMultiplier() * rateToSet;

    return rateNormalized.toFixed();
  }

  /**
   *
   * @param {integer} userId
   * @returns {Promise<string|*|string|HTMLElement|BodyInit|ReadableStream>}
   */
  static async requestUserById(userId) {
    const res = await request(server)
      .get(`/api/v1/users/${userId}`)
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  static validateUserJson(body, expectedUser, userFromDb) {

    expect(body.hasOwnProperty('account_name')).toBeTruthy();
    expect(body.account_name).toBe(expectedUser.account_name);

    const fieldsToCheck = [
        'users_education',
        'users_jobs',
        'users_sources'
    ];

    fieldsToCheck.forEach(field => {
      expect(body.hasOwnProperty(field)).toBeTruthy();
      expect(typeof body[field]).toBe('object');
      expect(JSON.stringify(body[field])).toBe(JSON.stringify(userFromDb[field]))
    });
  }

  static async validateFilenameIsSaved(body, fileUploadField, userId) {
    expect(body[fileUploadField]).toBeDefined();
    expect(body[fileUploadField].length).toBeGreaterThan(0);

    const dbUser = await UsersRepository.getUserById(userId);

    expect(dbUser[fileUploadField]).toBeDefined();
    expect(dbUser[fileUploadField]).toBe(body[fileUploadField]);
  }

  static async getUserVlad() {
    const vladSeed = UsersHelper.getUserVladSeed();
    const vladFromDb = await UsersRepository.getUserByAccountName(vladSeed.account_name);
    expect(vladFromDb).toBeDefined();

    const vladDbData = {
      id: vladFromDb.id
    };

    const token = AuthService.getNewJwtToken(vladSeed);

    return {
      ...vladSeed,
      ...vladDbData,
      token
    }
  }

  /**
   *
   * @returns {Promise<Object>}
   */
  static async getUserPetr() {
    const fromDb = await UsersRepository.getUserByAccountName('petr');
    expect(fromDb).toBeDefined();

    const data = {
      id: fromDb.id
    };

    const token = AuthService.getNewJwtToken(fromDb);

    return {
      ...data,
      token
    }
  }

  static async getUserJane() {
    const seed = UsersHelper.getUserJaneSeed();
    const fromDb = await UsersRepository.getUserByAccountName(seed.account_name);
    expect(fromDb).toBeDefined();

    const data = {
      id: fromDb.id
    };

    const token = AuthService.getNewJwtToken(seed);

    return {
      ...seed,
      ...data,
      token
    }
  }

  static getUserVladSeed() {
    return usersSeeds[0];
  }

  static getVladEosAccount() {
    return eosAccounts[0];
  }

  static getUserJaneSeed() {
    return usersSeeds[1];
  }

  static getJaneEosAccount() {
    return eosAccounts[1];
  }
}

module.exports = UsersHelper;