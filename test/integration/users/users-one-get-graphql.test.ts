import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import OneUserRequestHelper = require('../../helpers/users/one-user-request-helper');
import UsersHelper = require('../helpers/users-helper');
import UsersRepository = require('../../../lib/users/users-repository');

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
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
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
});

export {};
