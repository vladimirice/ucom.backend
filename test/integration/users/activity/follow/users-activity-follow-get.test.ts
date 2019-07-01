import { UserModel, UsersListResponse } from '../../../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../../../helpers/seeds-helper');
import OneUserRequestHelper = require('../../../../helpers/users/one-user-request-helper');
import ActivityHelper = require('../../../helpers/activity-helper');
import CommonChecker = require('../../../../helpers/common/common-checker');
import OrganizationsGenerator = require('../../../../generators/organizations-generator');
import MockHelper = require('../../../helpers/mock-helper');
import UosAccountsPropertiesUpdateService = require('../../../../../lib/uos-accounts-properties/service/uos-accounts-properties-update-service');
import CommonHelper = require('../../../helpers/common-helper');
import UsersActivityRequestHelper = require('../../../../helpers/users/activity/users-activity-request-helper');

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

describe('Users activity follow GET', () => {
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

  describe('both trust and follow', () => {
    it('Both trust and follow should work correctly', async () => {
      await ActivityHelper.requestToCreateFollow(userVlad, userJane);
      await UsersActivityRequestHelper.trustOneUserWithMockTransaction(userVlad, userJane.id);

      const userVladResponse = await OneUserRequestHelper.getOneUserFollowsOtherUsers(userVlad, '-current_rate', userVlad);
      const { data } = userVladResponse;

      const jane = data[0];

      expect(typeof jane.myselfData.follow).toBe('boolean');
      expect(jane.myselfData.follow).toBeTruthy();
    });
  });

  describe('One user followers', () => {
    it('get one user followers', async () => {
      await Promise.all([
        ActivityHelper.requestToCreateFollow(userJane, userVlad),
        ActivityHelper.requestToCreateFollow(userPetr, userVlad),

        // disturbance
        ActivityHelper.requestToCreateFollow(userRokky, userJane),
        ActivityHelper.requestToCreateFollow(userVlad, userJane),
      ]);

      // disturbance
      const orgId: number = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
      await ActivityHelper.requestToFollowOrganization(orgId, userJane);

      const response: UsersListResponse = await OneUserRequestHelper.getOneUserFollowedBy(
        userVlad,
        '-scaled_importance',
        userVlad,
      );

      CommonChecker.expectModelIdsExistenceInResponseList(response, [userJane.id, userPetr.id], 2);

      const userJaneResponse: UserModel = response.data.find(item => item.id === userJane.id)!;
      expect(userJaneResponse.myselfData.follow).toBe(true);
      expect(userJaneResponse.myselfData.myFollower).toBe(true);

      CommonHelper.checkUsersListResponseWithProps(response, true);
    });

    it('get one user follows other users', async () => {
      await ActivityHelper.requestToCreateFollow(userVlad, userPetr);
      await ActivityHelper.requestToCreateFollow(userVlad, userRokky);

      // disturbance
      await Promise.all([
        ActivityHelper.requestToCreateFollow(userJane, userVlad),
        ActivityHelper.requestToCreateFollow(userPetr, userVlad),
      ]);

      // disturbance
      const orgId: number = await OrganizationsGenerator.createOrgWithoutTeam(userJane);
      await ActivityHelper.requestToFollowOrganization(orgId, userVlad);

      const response: UsersListResponse = await OneUserRequestHelper.getOneUserFollowsOtherUsers(
        userVlad,
        '-current_rate',
        userVlad,
      );

      CommonChecker.expectModelIdsExistenceInResponseList(response, [userPetr.id, userRokky.id], 2);

      const userPetrResponse: UserModel = response.data.find(item => item.id === userPetr.id)!;
      expect(userPetrResponse.myselfData.follow).toBe(true);
      expect(userPetrResponse.myselfData.myFollower).toBe(true);

      CommonHelper.checkUsersListResponseWithProps(response, true);
    });
  });
});

export {};
