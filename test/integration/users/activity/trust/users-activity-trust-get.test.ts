import _ from 'lodash';
import { UserModel } from '../../../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../../../helpers/seeds-helper');
import OneUserRequestHelper = require('../../../../helpers/users/one-user-request-helper');
import ResponseHelper = require('../../../helpers/response-helper');
import CommonHelper = require('../../../helpers/common-helper');
import UsersRepository = require('../../../../../lib/users/users-repository');
import UsersHelper = require('../../../helpers/users-helper');
import UsersActivityRequestHelper = require('../../../../helpers/users/activity/users-activity-request-helper');
import ActivityHelper = require('../../../helpers/activity-helper');
import CommonChecker = require('../../../../helpers/common/common-checker');
import MockHelper = require('../../../helpers/mock-helper');
import UosAccountsPropertiesUpdateService = require('../../../../../lib/uos-accounts-properties/service/uos-accounts-properties-update-service');

require('jest-expect-message');

let userVlad:   UserModel;
let userJane:   UserModel;
let userPetr:   UserModel;
let userRokky:  UserModel;

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
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();

    await MockHelper.mockUosAccountsPropertiesFetchService(userVlad, userJane, userPetr, userRokky);
    await UosAccountsPropertiesUpdateService.updateAll();
  });

  describe('Do you trust this user', () => {
    it('trust property should be filled', async () => {
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
    }, JEST_TIMEOUT);
  });

  describe('One user is trusted by', () => {
    describe('Positive', () => {
      it('Get as guest', async () => {
        await UsersActivityRequestHelper.trustOneUserWithMockTransaction(userVlad, userJane.id);

        const janeOnlyTrustedByList =
          await OneUserRequestHelper.getOneUserTrustedByAsGuest(userJane.id);

        CommonChecker.expectModelIdsExistenceInResponseList(janeOnlyTrustedByList, [userVlad.id]);
        CommonHelper.checkUsersListResponseWithProps(janeOnlyTrustedByList, true);
      });

      it('Order by -id', async () => {
        const orderBy = '-id';
        await UsersActivityRequestHelper.trustOneUserWithMockTransaction(userVlad, userJane.id);

        const janeOnlyTrustedByList = await OneUserRequestHelper.getOneUserTrustedByAsMyself(
          userVlad,
          userJane.id,
          orderBy,
        );

        CommonChecker.expectModelIdsExistenceInResponseList(janeOnlyTrustedByList, [userVlad.id]);
        CommonHelper.checkUsersListResponseWithProps(janeOnlyTrustedByList, true);
      });

      it('GET One user is trusted by', async () => {
        const emptyTrustedByList = await OneUserRequestHelper.getOneUserTrustedByAsMyself(userVlad, userJane.id);
        ResponseHelper.checkEmptyResponseList(emptyTrustedByList);

        await UsersActivityRequestHelper.trustOneUserWithMockTransaction(userVlad, userJane.id);

        const janeOnlyTrustedByList = await OneUserRequestHelper.getOneUserTrustedByAsMyself(userVlad, userJane.id);

        CommonChecker.expectModelIdsExistenceInResponseList(janeOnlyTrustedByList, [userVlad.id]);
        CommonHelper.checkUsersListResponseWithProps(janeOnlyTrustedByList, true);

        // Second user trusts jane
        await UsersActivityRequestHelper.trustOneUserWithMockTransaction(userPetr, userJane.id);
        // and third just follows - for disturbance

        await ActivityHelper.requestToCreateFollowHistory(userRokky, userJane);

        const twoUsersTrustList = await OneUserRequestHelper.getOneUserTrustedByAsMyself(userVlad, userJane.id);
        CommonChecker.expectModelIdsExistenceInResponseList(twoUsersTrustList, [userVlad.id, userPetr.id]);

        CommonHelper.checkUsersListResponseWithProps(twoUsersTrustList, true);
      }, JEST_TIMEOUT);

      it('Get one user with trusted by list', async () => {
        await Promise.all([
          UsersActivityRequestHelper.trustOneUserWithMockTransaction(userVlad, userJane.id),
          UsersActivityRequestHelper.trustOneUserWithMockTransaction(userPetr, userJane.id),
        ]);

        const response = await OneUserRequestHelper.getOneUserWithTrustedByAsMyself(userVlad, userJane.id);

        expect(_.isEmpty(response.data.one_user)).toBeFalsy();
        expect(_.isEmpty(response.data.one_user_trusted_by)).toBeFalsy();

        CommonChecker.expectModelIdsExistenceInResponseList(
          response.data.one_user_trusted_by,
          [userVlad.id, userPetr.id],
        );

        const userJaneFromDb = await UsersRepository.getUserById(userJane.id);
        UsersHelper.validateUserJson(response.data.one_user, userJane, userJaneFromDb);

        CommonHelper.checkUsersListResponseWithProps(response.data.one_user_trusted_by, true);
      });
    });
  });
});

export {};
