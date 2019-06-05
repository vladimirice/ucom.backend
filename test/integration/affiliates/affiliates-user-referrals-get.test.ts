import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import AffiliatesRequest = require('../../helpers/affiliates/affiliates-request');
import ResponseHelper = require('../helpers/response-helper');

require('jest-expect-message');

let userVlad:   UserModel;
// @ts-ignore
let userJane:   UserModel;
// @ts-ignore
let userPetr:   UserModel;
// @ts-ignore
let userRokky:  UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 1000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 1000;

describe('Affiliates user referrals', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();
  });

  describe('One user referrals', () => {
    describe('Positive', () => {
      it('Get as guest', async () => {
        /*

          Create six referrals for one   user
          Create two referral for other user

          Fetch user referrals

          check user referrals amount and concrete entities
         */

        const emptyList = await AffiliatesRequest.getOneUserReferrals(userVlad.id);
        ResponseHelper.checkEmptyResponseList(emptyList);

        /*
        const manyOrgsIds: number[] = await OrganizationsGenerator.createManyOrgWithoutTeam(userJane, 5);

        await OrganizationsHelper.requestToFollowOrganization(manyOrgsIds[0], userVlad);

        const firstEntityOnlyList = await OneUserRequestHelper.getOneUserFollowsOrganizationsAsMyself(userVlad, userVlad.id);

        CommonHelper.expectModelIdsExistenceInResponseList(firstEntityOnlyList, [manyOrgsIds[0]]);

        await OrganizationsHelper.requestToFollowOrganization(manyOrgsIds[1], userVlad);

        const firstAndSecondEntitiesOnlyList = await OneUserRequestHelper.getOneUserFollowsOrganizationsAsMyself(userVlad, userVlad.id);
        CommonHelper.expectModelIdsExistenceInResponseList(firstAndSecondEntitiesOnlyList, [manyOrgsIds[0], manyOrgsIds[1]]);

        await OrganizationsHelper.requestToUnfollowOrganization(manyOrgsIds[0], userVlad);
        const secondEntityOnlyList = await OneUserRequestHelper.getOneUserFollowsOrganizationsAsMyself(userVlad, userVlad.id);
        CommonHelper.expectModelIdsExistenceInResponseList(secondEntityOnlyList, [manyOrgsIds[1]]);

        OrganizationsHelper.checkOrgListResponseStructure(firstAndSecondEntitiesOnlyList);

         */
      });

      it('GET myself follows organizations, ordered by id DESC with a pagination', async () => {
        // TODO
      /*
        const orderBy = 'id';

        const manyOrgsIds: number[] = await OrganizationsGenerator.createManyOrgWithoutTeam(userJane, 5);
        manyOrgsIds.sort();

        await OrganizationsHelper.requestToFollowOrganization(manyOrgsIds[0], userVlad);
        await OrganizationsHelper.requestToFollowOrganization(manyOrgsIds[1], userVlad);
        await OrganizationsHelper.requestToFollowOrganization(manyOrgsIds[2], userVlad);
        await OrganizationsHelper.requestToFollowOrganization(manyOrgsIds[3], userVlad);

        const response = await OneUserRequestHelper.getOneUserFollowsOrganizationsAsMyself(
          userVlad,
          userVlad.id,
          orderBy,
          2,
          2,
        );

        CommonHelper.expectModelIdsExistenceInResponseList(response, [manyOrgsIds[3], manyOrgsIds[2]]);

        expect(response.metadata.total_amount).toBe(4);
        expect(response.metadata.has_more).toBe(false);

        OrganizationsHelper.checkOrgListResponseStructure(response);

       */
      }, JEST_TIMEOUT);
    });
  });
});

export {};
