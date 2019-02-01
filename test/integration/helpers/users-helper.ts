import RequestHelper = require('./request-helper');
import ResponseHelper = require('./response-helper');

const eosJsEcc = require('eosjs-ecc');

const request = require('supertest');
const usersSeeds = require('../../../seeders/users/users');
const accountsData = require('../../../config/accounts-data');

const authService = require('../../../lib/auth/authService');
const usersRepository = require('../../../lib/users/users-repository');
const eosImportance = require('../../../lib/eos/eos-importance');
const server = require('../../../app');

const usersTeamRepository = require('../../../lib/users/repository').UsersTeam;
const orgModelProvider    = require('../../../lib/organizations/service').ModelProvider;

const eosApi = require('../../../lib/eos/eosApi');

require('jest-expect-message');

class UsersHelper {
  /**
   *
   * @param {number} orgId
   * @param {Object} user
   * @return {Promise<void>}
   */
  static async directlySetUserConfirmsInvitation(orgId, user) {
    await usersTeamRepository.setStatusConfirmed(
      orgModelProvider.getEntityName(),
      orgId,
      user.id,
    );
  }

  static async registerNewUser(givenAccountName = null) {
    const brainKey = eosApi.generateBrainkey();

    const accountName = givenAccountName || eosApi.createRandomAccountName();
    const [privateOwnerKey, privateActiveKey] = eosApi.getKeysByBrainkey(brainKey);

    // noinspection JSUnusedLocalSymbols
    const ownerPublicKey  = eosApi.getPublicKeyByPrivate(privateOwnerKey);
    const activePublicKey = eosApi.getPublicKeyByPrivate(privateActiveKey);

    const sign = eosJsEcc.sign(accountName, privateActiveKey);

    const url = RequestHelper.getRegistrationRoute();

    const fields = {
      sign,
      account_name: accountName,
      public_key: activePublicKey,
      brainkey: brainKey,
    };

    const res = await RequestHelper.makePostGuestRequestWithFields(url, fields);

    if (res.status !== 201) {
      throw new Error(`There is an error during request. Body is: ${JSON.stringify(res.body)}`);
    }

    // ResponseHelper.expectStatusCreated(res);

    return {
      body: res.body,
      accountData: {
        accountName,
        brainKey,
        privateKeyOwner:  privateOwnerKey,
        publicKeyOwner:   ownerPublicKey,

        privateKeyActive: privateActiveKey,
        publicKeyActive:  activePublicKey,
      },
    };
  }

  /**
   *
   * @param {Object} myself
   * @param {Object} fieldsToChange
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   *
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
   */
  static async requestToGetWallFeedAsGuest(
    wallOwner,
    query = '',
    dataOnly = true,
    expectedStatus = 200,
    allowEmpty = false,
  ) {
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
   */
  static async requestToGetMyselfNewsFeed(
    myself,
    queryString = '',
    dataOnly = true,
    expectedStatus = 200,
    allowEmpty = false,
  ) {
    const url = `${RequestHelper.getMyselfNewsFeedUrl()}/${queryString}`;

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
   */
  static async requestToGetWallFeedAsMyself(
    myself,
    wallOwner,
    query = '',
    dataOnly = true,
    expectedStatus = 200,
    allowEmpty = false,
  ) {
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

    // @ts-ignore
    expect(typeof model.User.current_rate, 'It seems user is not post-processed')
      .not.toBe('string');

    const expected = givenExpected || usersRepository.getModel().getFieldsForPreview().sort();
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

    // @ts-ignore
    expect(typeof model.User.current_rate, 'It seems user is not post-processed')
      .not.toBe('string');
    let expected = usersRepository.getModel().getFieldsForPreview().sort();

    if ((options.myselfData && !options.author) || (options.author && options.author.myselfData)) {
      expected = Array.prototype.concat(expected, [
        'I_follow', // #task not required for entity page if not user himself
        'followed_by', // #task not required for entity page if not user himself
        'myselfData',
      ]);
    }

    ResponseHelper.expectAllFieldsExistence(model.User, expected);
  }

  /**
   *
   * @param {Object[]} users
   */
  static checkManyUsersPreview(users) {
    users.forEach((user) => {
      this.checkUserPreview(user);
    });
  }

  /**
   *
   * @param {Object} user
   */
  public static checkUserPreview(user): void {
    this.checkIncludedUserPreview({
      User: user,
    });
  }

  /**
   *
   * @param {Object} user
   * @param {number} rateToSet
   * @returns {Promise<number>}
   */
  static async setSampleRateToUser(user, rateToSet = 0.1235) {
    await usersRepository.getModel().update(
      {
        current_rate: rateToSet,
      },
      {
        where: {
          id: user.id,
        },
      },
    );

    const rateNormalized = eosImportance.getImportanceMultiplier() * rateToSet;

    return +rateNormalized.toFixed();
  }

  /**
   *
   * @param {number} userId
   * @return {Promise<Object>}
   *
   */
  static async requestToGetUserAsGuest(userId) {
    const res = await request(server)
      .get(RequestHelper.getUserUrl(userId))
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
      'users_sources',
    ];

    fieldsToCheck.forEach((field) => {
      expect(body.hasOwnProperty(field)).toBeTruthy();
      expect(typeof body[field]).toBe('object');
      expect(JSON.stringify(body[field])).toBe(JSON.stringify(userFromDb[field]));
    });
  }

  static async validateFilenameIsSaved(body, fileUploadField, userId) {
    expect(body[fileUploadField]).toBeDefined();
    expect(body[fileUploadField].length).toBeGreaterThan(0);

    const dbUser = await usersRepository.getUserById(userId);

    expect(dbUser[fileUploadField]).toBeDefined();
    expect(dbUser[fileUploadField]).toBe(body[fileUploadField]);
  }

  /**
   *
   * @returns {PromiseLike<{id: *, token: *}>}
   */
  static async getUserVlad() {
    const vladSeed = UsersHelper.getUserVladSeed();
    const vladFromDb = await usersRepository.getUserByAccountName(vladSeed.account_name);
    expect(vladFromDb).toBeDefined();

    const vladDbData = {
      id: vladFromDb.id,
    };

    const token = authService.getNewJwtToken(vladDbData);

    return {
      ...vladSeed,
      ...vladDbData,
      token,
    };
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
  static async requestUserListAsGuest(queryString = '', allowEmpty = false) {
    const url = RequestHelper.getUsersUrl() + queryString;

    const res = await request(server)
      .get(url)
    ;

    ResponseHelper.expectStatusOk(res);
    ResponseHelper.expectValidListResponse(res, allowEmpty);

    return res.body.data;
  }

  /**
   *
   * @returns {Promise<Object>}
   */
  static async getUserPetr() {
    const seed = UsersHelper.getUserPetrSeed();
    const userAccountData = accountsData.petr;

    const fromDb = await usersRepository.getUserByAccountName(userAccountData.account_name);
    expect(fromDb).toBeDefined();

    const data = {
      id: fromDb.id,
    };

    const token = authService.getNewJwtToken(data);

    return {
      ...seed,
      ...data,
      token,
    };
  }

  /**
   *
   * @returns {Promise<Object>}
   */
  static async getUserRokky() {
    const seed = UsersHelper.getUserRokkySeed();
    const userAccountData = accountsData.rokky;

    const fromDb = await usersRepository.getUserByAccountName(userAccountData.account_name);
    expect(fromDb).toBeDefined();

    const data = {
      id: fromDb.id,
    };

    const token = authService.getNewJwtToken(data);

    return {
      ...seed,
      ...data,
      token,
    };
  }

  /**
   *
   * @returns {PromiseLike<{id: *, token: *}>}
   */
  static async getUserJane() {
    const seed = UsersHelper.getUserJaneSeed();
    const fromDb = await usersRepository.getUserByAccountName(seed.account_name);
    expect(fromDb).toBeDefined();

    const data = {
      id: fromDb.id,
    };

    const token = authService.getNewJwtToken(data);

    return {
      ...seed,
      ...data,
      token,
    };
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

  static getUserPetrSeed() {
    return usersSeeds[2];
  }

  static getUserRokkySeed() {
    return usersSeeds[3];
  }

  static getJaneEosAccount() {
    return accountsData.jane;
  }
}

export = UsersHelper;
