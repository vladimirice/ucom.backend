import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { StringToAnyCollection } from '../../../lib/common/interfaces/common-types';

import RequestHelper = require('./request-helper');
import ResponseHelper = require('./response-helper');

import UsersChecker = require('../../helpers/users/users-checker');
import CommonChecker = require('../../helpers/common/common-checker');
import UsersModelProvider = require('../../../lib/users/users-model-provider');
import UosAccountsModelProvider = require('../../../lib/uos-accounts-properties/service/uos-accounts-model-provider');
import UsersRepository = require('../../../lib/users/users-repository');
import knex = require('../../../config/knex');

const request = require('supertest');
const usersSeeds = require('../../../seeders/users/users');
const accountsData = require('../../../../secrets/accounts-data');

const authService = require('../../../lib/auth/authService');
const usersRepository = require('../../../lib/users/users-repository');
const eosImportance = require('../../../lib/eos/eos-importance');

const server = RequestHelper.getApiApplication();

const usersTeamRepository = require('../../../lib/users/repository').UsersTeam;
const orgModelProvider    = require('../../../lib/organizations/service').ModelProvider;

require('jest-expect-message');

class UsersHelper {
  public static propsAndCurrentParamsOptions(isMyself: boolean) {
    return {
      author: {
        myselfData: isMyself,
      },
      current_params: true,
      uos_accounts_properties: true,
    };
  }

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

  /**
   *
   * @param {Object} myself
   * @param {Object} fieldsToChange
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   *
   */
  public static async requestToUpdateMyself(
    myself: UserModel,
    fieldsToChange: StringToAnyCollection,
    expectedStatus: number = 200,
  ) {
    return this.requestToUpdateMyselfByToken(myself.token, fieldsToChange, expectedStatus);
  }

  public static async ensureUserExistByPatch(token: string): Promise<void> {
    const fieldsToChange = {
      first_name: 12345,
      birthday: '',
    };

    await this.requestToUpdateMyselfByToken(token, fieldsToChange);
  }

  public static async requestToUpdateMyselfByToken(
    token: string,
    fieldsToChange: StringToAnyCollection,
    expectedStatus: number = 200,
  ) {
    const url = RequestHelper.getMyselfUrl();

    const req = request(server)
      .patch(url)
    ;

    req.set('Authorization', `Bearer ${token}`);
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

  public static checkIncludedUserPreview(model, givenExpected = null, options: any = null) {
    expect(model.User).toBeDefined();
    expect(model.User instanceof Object).toBeTruthy();

    // @ts-ignore
    expect(typeof model.User.current_rate, 'It seems user is not post-processed')
      .not.toBe('string');

    let expected = givenExpected || usersRepository.getModel().getFieldsForPreview().sort();

    expected = this.addPropsToExpected(expected, options);
    this.checkUserProps(model.User, options);

    expected = this.addMyselfDataToExpectedSet(options, expected);

    CommonChecker.expectAllFieldsExistence(model.User, expected);
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

    if (options.airdrops) {
      expected.push('score', 'external_login');
    }

    expected = this.addPropsToExpected(expected, options);
    this.checkUserProps(model.User, options);

    CommonChecker.expectAllFieldsExistence(model.User, expected);

    if (options.current_params) {
      for (const field of UsersRepository.getPropsFields()) {
        CommonChecker.expectFieldToBePositiveOrZeroNumber(model.User, field);
      }
    }
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

  public static async initUosAccountsProperties(user: UserModel) {
    await knex(UosAccountsModelProvider.uosAccountsPropertiesTableName())
      .insert({
        account_name: user.account_name,
        entity_name: UsersModelProvider.getEntityName(),
        entity_id: user.id,

        staked_balance:                0,
        validity:                      0,

        importance:                    0,
        scaled_importance:             0,

        stake_rate:                    0,
        scaled_stake_rate:             0,

        social_rate:                   0,
        scaled_social_rate:            0,

        transfer_rate:                 0,
        scaled_transfer_rate:          0,

        previous_cumulative_emission:  0,
        current_emission:              0,
        current_cumulative_emission:   0,
      });
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
   * @param {number} userId
   * @returns {Promise<string|*|string|HTMLElement|BodyInit|ReadableStream>}
   */
  static async requestUserById(userId) {
    const res = await request(server)
      .get(`/api/v1/users/${userId}`)
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  public static validateUserJson(body, expectedUser, userFromDb) {
    expect(body.hasOwnProperty('account_name')).toBeTruthy();
    expect(body.account_name).toBe(expectedUser.account_name);

    UsersChecker.checkUosAccountsPropertiesStructure(body);

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

  public static async getAllSampleUsersFromDb(): Promise<UserModel[]> {
    return Promise.all([
      this.getUserVlad(),
      this.getUserJane(),
      this.getUserPetr(),
      this.getUserRokky(),
    ]);
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
      github_code: 'github_code_vlad',
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
      github_code: 'github_code_jane',
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

  private static addMyselfDataToExpectedSet(options: any, givenExpected: any) {
    if (!options) {
      return givenExpected;
    }

    if ((options.myselfData && !options.author) || (options.author && options.author.myselfData)) {
      return Array.prototype.concat(givenExpected, [
        'I_follow', // #task not required for entity page if not user himself
        'followed_by', // #task not required for entity page if not user himself
        'myselfData',
      ]);
    }
    return givenExpected;
  }

  private static checkUserProps(user, options) {
    if (options === null) {
      return;
    }

    if (options.current_params) {
      CommonChecker.expectAllFieldsPositiveOrZeroNumber(user, UsersModelProvider.getCurrentParamsToSelect());
    }

    if (options.uos_accounts_properties) {
      CommonChecker.expectAllFieldsPositiveOrZeroNumber(user, UosAccountsModelProvider.getFieldsToSelect());
    }
  }

  private static addPropsToExpected(expected: string[], options): string[] {
    if (!options) {
      return expected;
    }

    if (options.current_params) {
      expected = Array.prototype.concat(expected, UsersModelProvider.getCurrentParamsToSelect());
    }

    if (options.uos_accounts_properties) {
      expected = Array.prototype.concat(expected, UosAccountsModelProvider.getFieldsToSelect());
    }

    return expected;
  }
}

export = UsersHelper;
