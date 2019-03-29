import _ from 'lodash';
import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import OneUserRequestHelper = require('../../../helpers/users/one-user-request-helper');
import ResponseHelper = require('../../helpers/response-helper');
import CommonHelper = require('../../helpers/common-helper');
import UsersRepository = require('../../../../lib/users/users-repository');
import UsersHelper = require('../../helpers/users-helper');
import UsersActivityRequestHelper = require('../../../helpers/users/activity/users-activity-request-helper');
import ActivityHelper = require('../../helpers/activity-helper');

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

  describe('Do you trust this user', () => {
    it('trust property should be filled', async () => {
      // fetch via graphql parts
      const userVladBefore = await OneUserRequestHelper.getOneUserAsMyself(userJane, userVlad.id);

      expect(typeof userVladBefore.myselfData.trust).toBe('boolean');
      expect(userVladBefore.myselfData.trust).toBeFalsy();

      await UsersActivityRequestHelper.trustOneUserWithMockTransaction(userJane, userVlad.id);

      const userVladAfter = await OneUserRequestHelper.getOneUserAsMyself(userJane, userVlad.id);
      expect(userVladAfter.myselfData.trust).toBeTruthy();

      await UsersActivityRequestHelper.untrustOneUserWithMockTransaction(userJane, userVlad.id);

      const userVladAfterUntrust = await OneUserRequestHelper.getOneUserAsMyself(userJane, userVlad.id);
      expect(userVladAfterUntrust.myselfData.trust).toBeFalsy();

      await ActivityHelper.requestToCreateFollow(userJane, userVlad);
      await UsersActivityRequestHelper.trustOneUserWithMockTransaction(userJane, userVlad.id);

      const userVladWithTrustAndFollow = await OneUserRequestHelper.getOneUserAsMyself(userJane, userVlad.id);
      expect(userVladWithTrustAndFollow.myselfData.trust).toBeTruthy();
      expect(userVladWithTrustAndFollow.myselfData.follow).toBeTruthy();

      await ActivityHelper.requestToCreateFollow(userVlad, userJane);
      const userVladWithTrustAndAllFollow = await OneUserRequestHelper.getOneUserAsMyself(userJane, userVlad.id);
      expect(userVladWithTrustAndAllFollow.myselfData.trust).toBeTruthy();
      expect(userVladWithTrustAndAllFollow.myselfData.follow).toBeTruthy();
      expect(userVladWithTrustAndAllFollow.myselfData.myFollower).toBeTruthy();

    }, JEST_TIMEOUT_DEBUG);
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
      }, JEST_TIMEOUT);

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
