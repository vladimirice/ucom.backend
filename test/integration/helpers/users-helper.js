const usersSeeds = require('../../../seeders/users/users');
const accountsData = require('../../../config/accounts-data');

const AuthService = require('../../../lib/auth/authService');
const UsersRepository = require('../../../lib/users/users-repository');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const EosImportance = require('../../../lib/eos/eos-importance');
const request = require('supertest');
const server = require('../../../app');

const UsersTeamRepository = require('../../../lib/users/repository').UsersTeam;
const OrgModelProvider    = require('../../../lib/organizations/service').ModelProvider;

const EosJsEcc = require('eosjs-ecc');

const EosApi = require('../../../lib/eos/eosApi');

const _ = require('lodash');

require('jest-expect-message');

class UsersHelper {

  /**
   *
   * @param {number} orgId
   * @param {Object} user
   * @return {Promise<void>}
   */
  static async directlySetUserConfirmsInvitation(orgId, user) {
    await UsersTeamRepository.setStatusConfirmed(
      OrgModelProvider.getEntityName(),
      orgId,
      user.id
    );
  }

  /**
   *
   * @link UsersAuthService#processNewUserRegistration
   */
  static async registerNewUser() {
    const brainKey = EosApi.generateBrainkey();
    const accountName = EosApi.createRandomAccountName();

    const [ privateOwnerKey, privateActiveKey ] = EosApi.getKeysByBrainkey(brainKey);

    // noinspection JSUnusedLocalSymbols
    const ownerPublicKey  = EosApi.getPublicKeyByPrivate(privateOwnerKey);
    const activePublicKey = EosApi.getPublicKeyByPrivate(privateActiveKey);

    const sign = EosJsEcc.sign(accountName, privateActiveKey);

    const url = RequestHelper.getRegistrationRoute();

    const fields = {
      account_name: accountName,
      sign,
      public_key: activePublicKey,
      brainkey: brainKey,
    };

    const res = await RequestHelper.makePostGuestRequestWithFields(url, fields);

    ResponseHelper.expectStatusCreated(res);

    return res.body;
  }

  /**
   *
   * @param {Object} myself
   * @param {Object} fieldsToChange
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   *
   * @see UsersService#processUserUpdating
   */
  static async requestToUpdateMyself(myself, fieldsToChange, expectedStatus = 200) {
    const url = RequestHelper.getMyselfUrl();

    const req = request(server)
      .patch(url)
    ;

    RequestHelper.addAuthToken(req, myself);
    RequestHelper.addFieldsToRequest(req, fieldsToChange);

    const res = await req;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   *
   * @param {Object} wallOwner
   * @param {string} query
   * @param {boolean} dataOnly
   * @param {number} expectedStatus
   * @param {boolean} allowEmpty
   * @return {Promise<Object>}
   *
   * @link PostsFetchService#findAndProcessAllForUserWallFeed
   */
  static async requestToGetWallFeedAsGuest(wallOwner, query = '', dataOnly = true, expectedStatus = 200, allowEmpty = false) {
    const url = RequestHelper.getOneUserWallFeed(wallOwner.id) + query;

    const res = await request(server)
      .get(url)
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
   * @param {string} queryString
   * @param {boolean} dataOnly
   * @param {number} expectedStatus
   * @param {boolean} allowEmpty
   * @return {Promise<*>}
   *
   * @link PostService#findAndProcessAllForMyselfNewsFeed
   */
  static async requestToGetMyselfNewsFeed(myself, queryString = '', dataOnly = true, expectedStatus = 200, allowEmpty = false) {
    const url = RequestHelper.getMyselfNewsFeedUrl() + `/${queryString}`;

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

  // noinspection OverlyComplexFunctionJS
  /**
   * @param {Object} myself
   * @param {Object} wallOwner
   * @param {string} query
   * @param {boolean} dataOnly
   * @param {number} expectedStatus
   * @param {boolean} allowEmpty
   * @return {Promise<Object>}
   *
   * @link PostsFetchService#findAndProcessAllForUserWallFeed
   */
  static async requestToGetWallFeedAsMyself(myself, wallOwner, query = '', dataOnly = true, expectedStatus = 200, allowEmpty = false) {
    const url = RequestHelper.getOneUserWallFeed(wallOwner.id) + query;

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
   *
   * @link UsersService#getUserByIdAndProcess
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
    return accountsData.vlad;
  }

  static getUserJaneSeed() {
    return usersSeeds[1];
  }

  static getJaneEosAccount() {
    return accountsData.jane;
  }
}

module.exports = UsersHelper;