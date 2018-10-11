const usersSeeds = require('../../../seeders/users/users');
const eosAccounts = require('../../../seeders/users/eos_accounts');
const AuthService = require('../../../lib/auth/authService');
const UsersRepository = require('../../../lib/users/users-repository');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const EosImportance = require('../../../lib/eos/eos-importance');
const request = require('supertest');
const server = require('../../../app');

const _ = require('lodash');

require('jest-expect-message');

class UsersHelper {

  /**
   * See {@link PostsService#findAndProcessAllForUserWallFeed}
   *
   * @param {Object} targetUser
   * @param {boolean} dataOnly
   * @param {number} expectedStatus
   * @param {boolean} allowEmpty
   * @return {Promise<Object>}
   */
  static async requestToGetWallFeedAsGuest(targetUser, dataOnly = true, expectedStatus = 200, allowEmpty = false) {
    const res = await request(server)
      .get(RequestHelper.getOneUserWallFeed(targetUser.id))
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    if (expectedStatus === 200) {
      ResponseHelper.expectValidListResponse(res, allowEmpty);
    }

    if (dataOnly) {
      return res.body.data;
    }

    return res.body;
  }

  /**
   * @param {Object} myself
   * @param {boolean} dataOnly
   * @param {number} expectedStatus
   * @param {boolean} allowEmpty
   * @return {Promise<*>}
   *
   * @link PostService#findAndProcessAllForMyselfNewsFeed
   */
  static async requestToGetMyselfNewsFeed(myself, dataOnly = true, expectedStatus = 200, allowEmpty = false) {
    const url = RequestHelper.getMyselfNewsFeedUrl();

    const res = await request(server)
      .get(url)
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    if (expectedStatus === 200) {
      ResponseHelper.expectValidListResponse(res, allowEmpty);
    }

    if (dataOnly) {
      return res.body.data;
    }

    return res.body;
  }

  /**
   * See {@link PostsService#findAndProcessAllForOrgWallFeed}
   *
   * @param {Object} myself
   * @param {Object} targetUser
   * @param {boolean} dataOnly
   * @param {number} expectedStatus
   * @param {boolean} allowEmpty
   * @return {Promise<Object>}
   */
  static async requestToGetWallFeedAsMyself(myself, targetUser, dataOnly = true, expectedStatus = 200, allowEmpty = false) {
    const res = await request(server)
      .get(RequestHelper.getOneUserWallFeed(targetUser.id))
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    if (expectedStatus === 200) {
      ResponseHelper.expectValidListResponse(res, allowEmpty);
    }

    if (dataOnly) {
      return res.body.data;
    }

    return res.body;
  }

  /**
   *
   * @param {Object} model - model with included user
   * @param {string[]|null} givenExpected - model with included user
   */
  static checkIncludedUserPreview(model, givenExpected = null) {
    expect(model.User).toBeDefined();
    expect(model.User instanceof Object).toBeTruthy();

    expect(typeof model.User.current_rate, 'It seems user is not post-processed').not.toBe('string');

    const expected = givenExpected ? givenExpected : UsersRepository.getModel().getFieldsForPreview().sort();
    ResponseHelper.expectAllFieldsExistence(model.User, expected);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   */
  static checkIncludedUserForEntityPage(model, options) {
    expect(model.User).toBeDefined();
    expect(model.User instanceof Object).toBeTruthy();

    expect(typeof model.User.current_rate, 'It seems user is not post-processed').not.toBe('string');
    let expected = UsersRepository.getModel().getFieldsForPreview().sort();

    if (options.myselfData) {
      expected = _.concat(expected, [
        'I_follow', // TODO not required for entity page if not user himself
        'followed_by', // TODO not required for entity page if not user himself
        'myselfData'
      ]);
    }

    ResponseHelper.expectAllFieldsExistence(model.User, expected);
  }

  static checkUserPreview(user) {
    expect(user).toBeTruthy();

    // TODO
    const expected = UsersRepository.getModel().getFieldsForPreview().sort();
    ResponseHelper.expectAllFieldsExistence(user, expected);
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
   * @param {number} user_id
   * @return {Promise<Object>}
   */
  static async requestToGetUserAsGuest(user_id) {
    const res = await request(server)
      .get(RequestHelper.getUserUrl(user_id))
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
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