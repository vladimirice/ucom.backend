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
  });


  describe('One user followers', () => {
    it('get one user followers', async () => {
      /*
        Create following history
        ensure that an index is filled
        fetch via following api like for trust
       */
    });
  });

  describe('One user is followed by', () => {
    describe('Positive', () => {
      it('Get as guest', async () => {
        await UsersActivityRequestHelper.trustOneUserWithMockTransaction(userVlad, userJane.id);

        const janeOnlyTrustedByList =
          await OneUserRequestHelper.getOneUserTrustedByAsGuest(userJane.id);

        CommonHelper.expectModelIdsExistenceInResponseList(janeOnlyTrustedByList, [userVlad.id]);
        CommonHelper.checkUsersListResponseForMyselfData(janeOnlyTrustedByList);
      });

      it('Order by -id', async () => {
        const orderBy = '-id';
        await UsersActivityRequestHelper.trustOneUserWithMockTransaction(userVlad, userJane.id);

        const janeOnlyTrustedByList = await OneUserRequestHelper.getOneUserTrustedByAsMyself(
          userVlad,
          userJane.id,
          orderBy,
        );

        CommonHelper.expectModelIdsExistenceInResponseList(janeOnlyTrustedByList, [userVlad.id]);
        CommonHelper.checkUsersListResponseForMyselfData(janeOnlyTrustedByList);
      });

      it('GET One user is followed by', async () => {
        const emptyTrustedByList = await OneUserRequestHelper.getOneUserTrustedByAsMyself(userVlad, userJane.id);
        ResponseHelper.checkEmptyResponseList(emptyTrustedByList);

        await UsersActivityRequestHelper.trustOneUserWithMockTransaction(userVlad, userJane.id);

        const janeOnlyTrustedByList = await OneUserRequestHelper.getOneUserTrustedByAsMyself(userVlad, userJane.id);

        CommonHelper.expectModelIdsExistenceInResponseList(janeOnlyTrustedByList, [userVlad.id]);
        CommonHelper.checkUsersListResponseForMyselfData(janeOnlyTrustedByList);

        // Second user trusts jane
        await UsersActivityRequestHelper.trustOneUserWithMockTransaction(userPetr, userJane.id);
        // and third just follows - for disturbance

        await ActivityHelper.requestToCreateFollowHistory(userRokky, userJane);

        const twoUsersTrustList = await OneUserRequestHelper.getOneUserTrustedByAsMyself(userVlad, userJane.id);
        CommonHelper.expectModelIdsExistenceInResponseList(twoUsersTrustList, [userVlad.id, userPetr.id]);
        CommonHelper.checkUsersListResponseForMyselfData(twoUsersTrustList);
      }, JEST_TIMEOUT);

      it('Get one user with followed by list', async () => {
        await Promise.all([
          UsersActivityRequestHelper.trustOneUserWithMockTransaction(userVlad, userJane.id),
          UsersActivityRequestHelper.trustOneUserWithMockTransaction(userPetr, userJane.id),
        ]);

        const response = await OneUserRequestHelper.getOneUserWithTrustedByAsMyself(userVlad, userJane.id);

        expect(_.isEmpty(response.data.one_user)).toBeFalsy();
        expect(_.isEmpty(response.data.one_user_trusted_by)).toBeFalsy();

        CommonHelper.checkUsersListResponseForMyselfData(response.data.one_user_trusted_by);
        CommonHelper.expectModelIdsExistenceInResponseList(
          response.data.one_user_trusted_by,
          [userVlad.id, userPetr.id],
        );

        const userJaneFromDb = await UsersRepository.getUserById(userJane.id);
        UsersHelper.validateUserJson(response.data.one_user, userJane, userJaneFromDb);
      });
    });
  });
});

export {};
