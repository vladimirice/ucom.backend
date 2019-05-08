import { UserModel } from '../../../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../../../helpers/seeds-helper');
import OneUserRequestHelper = require('../../../../helpers/users/one-user-request-helper');
import ResponseHelper = require('../../../helpers/response-helper');
import CommonHelper = require('../../../helpers/common-helper');
import OrganizationsHelper = require('../../../helpers/organizations-helper');
import OrganizationsGenerator = require('../../../../generators/organizations-generator');

let userVlad:   UserModel;
let userJane:   UserModel;

const beforeAfterOptions = {
  isGraphQl: true,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 1000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 1000;

describe('Organizations activity follow GET', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  describe('One user follows such organizations', () => {
    describe('Positive', () => {
      it('GET myself follows organizations', async () => {
        const emptyList = await OneUserRequestHelper.getOneUserFollowsOrganizationsAsMyself(userVlad, userVlad.id);
        ResponseHelper.checkEmptyResponseList(emptyList);

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
      }, JEST_TIMEOUT);

      it('GET myself follows organizations, ordered by id DESC with a pagination', async () => {
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
      }, JEST_TIMEOUT);
    });
  });
});

export {};
