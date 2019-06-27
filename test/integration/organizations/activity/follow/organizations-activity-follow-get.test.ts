import { UserModel } from '../../../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../../../helpers/seeds-helper');
import ResponseHelper = require('../../../helpers/response-helper');
import OrganizationsHelper = require('../../../helpers/organizations-helper');
import OrganizationsGenerator = require('../../../../generators/organizations-generator');
import ManyOrganizationsRequest = require('../../../../helpers/organizations/many-organizations-request');
import OneOrganizationRequest = require('../../../../helpers/organizations/one-organization-request');
import ActivityHelper = require('../../../helpers/activity-helper');
import CommonChecker = require('../../../../helpers/common/common-checker');

let userVlad:   UserModel;
let userJane:   UserModel;
let userPetr:   UserModel;
let userRokky:   UserModel;

const JEST_TIMEOUT = 1000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 1000;

describe('Organizations activity follow GET', () => {
  beforeAll(async () => {
    await SeedsHelper.withGraphQlMockAllWorkers();
  });
  afterAll(async () => {
    await SeedsHelper.afterAllWithGraphQl();
  });
  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutineMockAccountsProperties();
  });

  describe('One user follows such organizations', () => {
    describe('Positive', () => {
      describe('I follow organizations', () => {
        it('GET myself follows organizations', async () => {
          const emptyList = await ManyOrganizationsRequest.getOneUserFollowsOrganizationsAsMyself(userVlad, userVlad.id);
          ResponseHelper.checkEmptyResponseList(emptyList);

          const manyOrgsIds: number[] = await OrganizationsGenerator.createManyOrgWithoutTeam(userJane, 5);

          await OrganizationsHelper.requestToFollowOrganization(manyOrgsIds[0], userVlad);

          const firstEntityOnlyList = await ManyOrganizationsRequest.getOneUserFollowsOrganizationsAsMyself(userVlad, userVlad.id);

          CommonChecker.expectModelIdsExistenceInResponseList(firstEntityOnlyList, [manyOrgsIds[0]]);

          await OrganizationsHelper.requestToFollowOrganization(manyOrgsIds[1], userVlad);

          const firstAndSecondEntitiesOnlyList = await ManyOrganizationsRequest.getOneUserFollowsOrganizationsAsMyself(userVlad, userVlad.id);
          CommonChecker.expectModelIdsExistenceInResponseList(firstAndSecondEntitiesOnlyList, [manyOrgsIds[0], manyOrgsIds[1]]);

          await OrganizationsHelper.requestToUnfollowOrganization(manyOrgsIds[0], userVlad);
          const secondEntityOnlyList = await ManyOrganizationsRequest.getOneUserFollowsOrganizationsAsMyself(userVlad, userVlad.id);
          CommonChecker.expectModelIdsExistenceInResponseList(secondEntityOnlyList, [manyOrgsIds[1]]);

          OrganizationsHelper.checkOrgListResponseStructure(firstAndSecondEntitiesOnlyList);
        }, JEST_TIMEOUT);

        it('GET myself follows organizations, ordered by id DESC with a pagination', async () => {
          const orderBy = 'id';

          const manyOrgsIds: number[] = await OrganizationsGenerator.createManyOrgWithoutTeam(userJane, 5);
          manyOrgsIds.sort();

          await OrganizationsHelper.requestToFollowOrganization(manyOrgsIds[0], userVlad);
          await OrganizationsHelper.requestToFollowOrganization(manyOrgsIds[1], userVlad);
          await OrganizationsHelper.requestToFollowOrganization(manyOrgsIds[2], userVlad);
          await OrganizationsHelper.requestToFollowOrganization(manyOrgsIds[3], userVlad);

          const response = await ManyOrganizationsRequest.getOneUserFollowsOrganizationsAsMyself(
            userVlad,
            userVlad.id,
            orderBy,
            2,
            2,
          );

          CommonChecker.expectModelIdsExistenceInResponseList(response, [manyOrgsIds[3], manyOrgsIds[2]]);

          expect(response.metadata.total_amount).toBe(4);
          expect(response.metadata.has_more).toBe(false);

          OrganizationsHelper.checkOrgListResponseStructure(response);
        }, JEST_TIMEOUT);
      });

      describe('Organization is followed by', () => {
        it('GET organization is followed by', async () => {
          const firstOrgId: number = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
          const secondOrgId: number = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

          await Promise.all([
            ActivityHelper.requestToFollowOrganization(firstOrgId, userJane),
            ActivityHelper.requestToFollowOrganization(firstOrgId, userPetr),

            // Disturbance
            ActivityHelper.requestToFollowOrganization(secondOrgId, userRokky),
          ]);

          const response = await OneOrganizationRequest.getOneOrganizationIsFollowedBy(userVlad, firstOrgId);
          CommonChecker.expectModelIdsExistenceInResponseList(response, [userJane.id, userPetr.id]);
        }, JEST_TIMEOUT);
      });
    });
  });
});

export {};
