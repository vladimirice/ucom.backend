import _ from 'lodash';
import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import OneUserRequestHelper = require('../../../helpers/users/one-user-request-helper');
import ResponseHelper = require('../../helpers/response-helper');
import CommonHelper = require('../../helpers/common-helper');
import UsersRepository = require('../../../../lib/users/users-repository');
import UsersHelper = require('../../helpers/users-helper');

require('jest-expect-message');

let userVlad: UserModel;
let userJane: UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 1000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 1000;

describe('Users activity trust GET', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  describe('One user is trusted by', () => {
    describe('Positive', () => {
      it('GET One user is trusted by', async () => {
        // TODO - This is interface only
        const trustedBy = await OneUserRequestHelper.getOneUserTrustedByAsMyself(userVlad, userJane.id);

        ResponseHelper.checkListResponseStructure(trustedBy);

        const options = {
          author: {
            myselfData: true,
          },
        };

        CommonHelper.checkUsersListResponse(trustedBy, options);
      }, JEST_TIMEOUT_DEBUG);

      it('Get one user with trusted by list', async () => {
        // TODO - This is interface only
        const response = await OneUserRequestHelper.getOneUserWithTrustedByAsMyself(userVlad, userJane.id);

        expect(_.isEmpty(response.data.one_user)).toBeFalsy();
        expect(_.isEmpty(response.data.one_user_trusted_by)).toBeFalsy();

        const options = {
          author: {
            myselfData: true,
          },
        };
        CommonHelper.checkUsersListResponse(response.data.one_user_trusted_by, options);

        const userJaneFromDb = await UsersRepository.getUserById(userJane.id);

        UsersHelper.validateUserJson(response.data.one_user, userJane, userJaneFromDb);
      });
    });
  });
});

export {};
