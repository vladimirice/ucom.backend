import { EntityNames } from 'ucom.libs.common';
import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import OneUserRequestHelper = require('../../../helpers/users/one-user-request-helper');
import UsersHelper = require('../../helpers/users-helper');
import UsersRepository = require('../../../../lib/users/users-repository');
import CommonChecker = require('../../../helpers/common/common-checker');
import knex = require('../../../../config/knex');
import UsersModelProvider = require('../../../../lib/users/users-model-provider');

let userVlad: UserModel;
let userJane: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 5000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 1000;

describe('Get one user via graphQL', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutineMockAccountsProperties();
  });

  describe('One user profile view', () => {
    it('should create a new record inside users activity views - from logged user', async () => {
      await OneUserRequestHelper.getOneUserAsMyself(
        userVlad,
        userJane.id,
      );

      const record = await knex(UsersModelProvider.getUsersActivityEventsViewTableName())
        .where({
          user_id:    userVlad.id,
          entity_id:  userJane.id,
          entity_name: EntityNames.USERS,
        });

      CommonChecker.expectNotEmpty(record);
    }, JEST_TIMEOUT);

    it('should create a new record inside users activity views - from guest', async () => {
      await OneUserRequestHelper.getOneUserAsGuest(userJane.id);

      const record = await knex(UsersModelProvider.getUsersActivityEventsViewTableName())
        .where({
          user_id:    null,
          entity_id:  userJane.id,
          entity_name: EntityNames.USERS,
        });

      CommonChecker.expectNotEmpty(record);
    }, JEST_TIMEOUT);

    it('should contain number of views - both for logged views and guest views', async () => {
      await OneUserRequestHelper.getOneUserAsGuest(userJane.id);
      const user = await OneUserRequestHelper.getOneUserAsGuest(userJane.id);

      expect(user.views_count).toBeDefined();
      expect(user.views_count).toBe(2);
    });
  });

  describe('Positive', () => {
    it('Get one user by id - using identity filter', async () => {
      const filters = {
        user_identity: `${userVlad.id}`,
      };

      const userVladResponse = await OneUserRequestHelper.getOneUserAsMyself(
        userJane,
        userVlad.id,
        filters,
      );

      const user = await UsersRepository.getUserById(userVlad.id);

      UsersHelper.validateUserJson(userVladResponse, userVlad, user);
    }, JEST_TIMEOUT_DEBUG);

    it('Get one user by account_name - using identity filter', async () => {
      const filters = {
        user_identity: userVlad.account_name,
      };

      const userVladResponse = await OneUserRequestHelper.getOneUserAsMyself(
        userJane,
        userVlad.id,
        filters,
      );

      const user = await UsersRepository.getUserById(userVlad.id);

      UsersHelper.validateUserJson(userVladResponse, userVlad, user);
    }, JEST_TIMEOUT_DEBUG);

    it('Get one user via graphQL as myself', async () => {
      const userVladResponse = await OneUserRequestHelper.getOneUserAsMyself(userJane, userVlad.id);
      const user = await UsersRepository.getUserById(userVlad.id);

      UsersHelper.validateUserJson(userVladResponse, userVlad, user);
    }, JEST_TIMEOUT);

    it('Get one user via graphQL as guest', async () => {
      const userVladResponse = await OneUserRequestHelper.getOneUserAsGuest(userJane.id);
      const user = await UsersRepository.getUserById(userJane.id);

      UsersHelper.validateUserJson(userVladResponse, userJane, user);
    }, JEST_TIMEOUT);
  });

  describe('Negative', () => {
    const graphQlErrorPattern = new RegExp('GraphQL error');

    it('Incorrect string identity', async () => {
      const filters = {
        user_identity: 'linkedin',
      };

      await expect(OneUserRequestHelper.getOneUserAsMyself(userJane, userVlad.id, filters)).rejects.toThrow(graphQlErrorPattern);
    });

    it('Incorrect identity - zero', async () => {
      const filters = {
        user_identity: '0',
      };

      await expect(OneUserRequestHelper.getOneUserAsMyself(userJane, userVlad.id, filters)).rejects.toThrow(graphQlErrorPattern);
    });
  });
});

export {};
