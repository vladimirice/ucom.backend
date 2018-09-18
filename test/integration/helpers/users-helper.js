const usersSeeds = require('../../../seeders/users/users');
const eosAccounts = require('../../../seeders/users/eos_accounts');
const AuthService = require('../../../lib/auth/authService');
const UsersRepository = require('../../../lib/users/users-repository');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const EosImportance = require('../../../lib/eos/eos-importance');
const request = require('supertest');
const server = require('../../../app');


require('jest-expect-message');

class UsersHelper {

  /**
   *
   * @param {Object[]}models
   */
  static checkIncludedUserPreviewForArray(models) {
    models.forEach(model => {
      this.checkIncludedUserPreview(model);
    })
  }

  /**
   *
   * @param {Object} model - model with included user
   * @param {string[]|null} expected - model with included user
   */
  static checkIncludedUserPreview(model, expected = null) {
    expect(model['User']).toBeDefined();
    expect(model['User'] instanceof Object).toBeTruthy();

    if (!expected) {
      expected = UsersRepository.getModel().getFieldsForPreview().sort();
    }
    ResponseHelper.expectAllFieldsExistence(model['User'], expected);
  }

  /**
   * @deprecated
   * @see setSampleRateToUser
   * @returns {Promise<string>}
   */
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
   * @param {Object} user
   * @param {number} rateToSet
   * @returns {Promise<number>}
   */
  static async setSampleRateToUser(user, rateToSet = 0.1235) {

    await UsersRepository.getModel().update(
      {
        'current_rate': rateToSet
      },
      {
        where: {
          id: user.id
        }
      }
    );

    const rateNormalized = EosImportance.getImportanceMultiplier() * rateToSet;

    return +rateNormalized.toFixed();
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

  /**
   *
   * @returns {PromiseLike<{id: *, token: *}>}
   */
  static async getUserVlad() {
    const vladSeed = UsersHelper.getUserVladSeed();
    const vladFromDb = await UsersRepository.getUserByAccountName(vladSeed.account_name);
    expect(vladFromDb).toBeDefined();

    const vladDbData = {
      id: vladFromDb.id
    };

    const token = AuthService.getNewJwtToken(vladDbData);

    return {
      ...vladSeed,
      ...vladDbData,
      token
    }
  }

  /**
   * @param {Object} user
   * @returns {Promise<Object[]>}
   */
  static async requestUserListByMyself(user) {
    const res = await request(server)
      .get(RequestHelper.getUsersUrl())
      .set('Authorization', `Bearer ${user.token}`)
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  /**
   * @returns {Promise<Object[]>}
   */
  static async requestUserListAsGuest() {
    const res = await request(server)
      .get(RequestHelper.getUsersUrl())
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
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

    const token = AuthService.getNewJwtToken(data);

    return {
      ...data,
      token
    }
  }

  /**
   *
   * @returns {Promise<Object>}
   */
  static async getUserRokky() {
    const fromDb = await UsersRepository.getUserByAccountName('rokky');
    expect(fromDb).toBeDefined();

    const data = {
      id: fromDb.id
    };

    const token = AuthService.getNewJwtToken(data);

    return {
      ...data,
      token
    }
  }

  /**
   *
   * @returns {PromiseLike<{id: *, token: *}>}
   */
  static async getUserJane() {
    const seed = UsersHelper.getUserJaneSeed();
    const fromDb = await UsersRepository.getUserByAccountName(seed.account_name);
    expect(fromDb).toBeDefined();

    const data = {
      id: fromDb.id
    };

    const token = AuthService.getNewJwtToken(data);

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