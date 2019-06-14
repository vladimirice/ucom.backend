import { UserModel, UsersListResponse } from '../../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../../helpers/seeds-helper');
import ManyUsersRequestHelper = require('../../../helpers/users/many-users-request-helper');
import UsersDirectSetter = require('../../../generators/users/users-direct-setter');
import CommonChecker = require('../../../helpers/common/common-checker');
import MockHelper = require('../../helpers/mock-helper');
import UosAccountsPropertiesUpdateService = require('../../../../lib/uos-accounts-properties/service/uos-accounts-properties-update-service');
import CommonHelper = require('../../helpers/common-helper');
import ActivityHelper = require('../../helpers/activity-helper');
import UsersModelProvider = require('../../../../lib/users/users-model-provider');
import UosAccountsModelProvider = require('../../../../lib/uos-accounts-properties/service/uos-accounts-model-provider');

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;
let userRokky: UserModel;

const JEST_TIMEOUT = 5000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'blockchainOnly',
};

describe('Users. Get requests', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });

  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Trending users', () => {
    beforeEach(async () => {
      await MockHelper.mockUosAccountsPropertiesFetchService(userVlad, userJane, userPetr, userRokky);
      await UosAccountsPropertiesUpdateService.updateAll();

      await Promise.all([
        UsersDirectSetter.setAllCurrentParamsForUser(userVlad),
        UsersDirectSetter.setAllCurrentParamsForUser(userJane),
        UsersDirectSetter.setAllCurrentParamsForUser(userPetr),
      ]);

      // disturbance
      await Promise.all([
        UsersDirectSetter.setPositivePostsTotalAmountDelta(userRokky),
        UsersDirectSetter.setPositiveScaledImportanceDelta(userRokky),
      ]);
    }, JEST_TIMEOUT * 3);

    it('should return a valid list of trending users for guest', async () => {
      const filledResponse: UsersListResponse =
        await ManyUsersRequestHelper.getManyTrendingUsersAsGuest();

      CommonChecker.expectModelIdsExistenceInResponseList(
        filledResponse,
        [userVlad.id, userJane.id, userPetr.id],
        3,
      );

      CommonChecker.expectModelIdsDoNotExistInResponseList(filledResponse, [userRokky.id]);

      const usersCheckOptions = {
        author: {
          myselfData: false,
        },
        current_params: true,
        uos_accounts_properties: true,
      };
      CommonHelper.checkUsersListResponse(filledResponse, usersCheckOptions);
    }, JEST_TIMEOUT);

    it('fetch data as myself', async () => {
      await Promise.all([
        ActivityHelper.requestToCreateFollow(userVlad, userJane),
        ActivityHelper.requestToCreateFollow(userJane, userVlad),
      ]);

      const filledResponse: UsersListResponse =
        await ManyUsersRequestHelper.getManyTrendingUsersAsMyself(userVlad);

      CommonChecker.expectModelIdsExistenceInResponseList(
        filledResponse,
        [userVlad.id, userJane.id, userPetr.id],
        3,
      );

      const usersCheckOptions = {
        author: {
          myselfData: true,
        },
        current_params: true,
        uos_accounts_properties: true,
      };

      const janeFromList = filledResponse.data.find(item => item.id === userJane.id)!;

      expect(janeFromList.myselfData.follow).toBe(true);
      expect(janeFromList.myselfData.myFollower).toBe(true);

      CommonHelper.checkUsersListResponse(filledResponse, usersCheckOptions);
    }, JEST_TIMEOUT);

    it('check additional fields - current params and uos_accounts_properties', async () => {
      const filledResponse: UsersListResponse =
        await ManyUsersRequestHelper.getManyTrendingUsersAsMyself(userVlad);

      const expectedFields = UsersModelProvider.getCurrentParamsToSelect().concat(
        UosAccountsModelProvider.getFieldsToSelect(),
      );

      for (const user of filledResponse.data) {
        for (const field of expectedFields) {
          if (UsersModelProvider.getCurrentParamsToSelect().includes(field)) {
            expect(user[field]).toBeGreaterThan(0);
          } else {
            expect(user[field]).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }, JEST_TIMEOUT);

    it('check ordering - smoke test', async () => {
      const orderBy = '-scaled_importance,posts_total_amount_delta,-id';

      const filledResponse: UsersListResponse =
        await ManyUsersRequestHelper.getManyTrendingUsers(userVlad, orderBy);

      CommonChecker.expectModelIdsExistenceInResponseList(
        filledResponse,
        [userVlad.id, userJane.id, userPetr.id],
        3,
      );

      const usersCheckOptions = {
        author: {
          myselfData: true,
        },
        current_params: true,
        uos_accounts_properties: true,
      };

      CommonHelper.checkUsersListResponse(filledResponse, usersCheckOptions);

      // #task check ordering itself
    }, JEST_TIMEOUT);

    it('check pagination - smoke test', async () => {
      const page    = 1;
      const perPage = 2;

      const firstPage: UsersListResponse =
        await ManyUsersRequestHelper.getManyTrendingUsers(userVlad, 'id', page, perPage);

      CommonChecker.expectModelIdsExistenceInResponseList(
        firstPage,
        [userVlad.id, userJane.id],
        3,
      );

      expect(firstPage.metadata.has_more).toBe(true);

      const secondPage: UsersListResponse =
        await ManyUsersRequestHelper.getManyTrendingUsers(userVlad, 'id', page + 1, perPage);

      CommonChecker.expectModelIdsExistenceInResponseList(
        secondPage,
        [userPetr.id],
        3,
      );

      expect(secondPage.metadata.has_more).toBe(false);
    }, JEST_TIMEOUT);
  });
});

export {};
