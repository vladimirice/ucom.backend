import { DbParamsDto } from '../../../lib/api/filters/interfaces/query-filter-interfaces';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../helpers/graphql-helper';

import SeedsHelper = require('../helpers/seeds-helper');
import OrganizationsHelper = require('../helpers/organizations-helper');
import OrganizationsRepository = require('../../../lib/organizations/repository/organizations-repository');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import CommonHelper = require('../helpers/common-helper');

let userVlad: UserModel;

const JEST_TIMEOUT = 10000;

describe('Organizations. Get requests', () => {
  beforeAll(async () => {
    await GraphqlHelper.beforeAll();
  });

  afterAll(async () => {
    await Promise.all([
      GraphqlHelper.afterAll(),
      SeedsHelper.sequelizeAfterAll(),
    ]);
  });
  beforeEach(async () => {
    [userVlad] = await SeedsHelper.beforeAllRoutine(true);
  });

  describe('Many organizations', () => {
    const orgsAmountToCreate = 10;
    let orgsIds: number[] = [];

    beforeEach(async () => {
      orgsIds = await OrganizationsGenerator.createManyOrgWithoutTeam(userVlad, orgsAmountToCreate);
    });

    describe('Many organization smoke tests', () => {
      it('Get organization lists without query string', async () => {
        const response = await GraphqlHelper.getManyOrgsAsMyself(userVlad);

        OrganizationsHelper.checkOrgListResponseStructure(response);
        CommonHelper.expectModelIdsExistenceInResponseList(response, orgsIds);
      }, JEST_TIMEOUT);
    });

    describe('Test sorting', () => {
      const orgMaxRateId = 3;
      const orgMiddleRateId = 5;
      const orgMinRateId = 4;

      beforeEach(async () => {
        await Promise.all([
          OrganizationsHelper.setSampleRateToOrg(orgMaxRateId, 100),
          OrganizationsHelper.setSampleRateToOrg(orgMiddleRateId, 75),
          OrganizationsHelper.setSampleRateToOrg(orgMinRateId, 50),
        ]);
      });

      it('Sort by current_rate DESC', async () => {
        const orderBy = '-current_rate,-id';

        const page = 1;
        const perPage = 3;

        const orgs =
          await GraphqlHelper.getManyOrgsDataOnlyAsMyself(userVlad, orderBy, page, perPage);

        expect(orgs[0].id).toBe(orgMaxRateId);
        expect(orgs[orgs.length - 1].id).toBe(orgMinRateId);
      });

      it('Sort by title ASC', async () => {
        const orderBy = 'title,-id';

        const orgs = await GraphqlHelper.getManyOrgsDataOnlyAsMyself(userVlad, orderBy);

        const [minId, maxId]: [number, number] = await Promise.all([
          OrganizationsRepository.findMinOrgIdByParameter('title'),
          OrganizationsRepository.findMaxOrgIdByParameter('title'),
        ]);

        expect(orgs[orgs.length - 1].id).toBe(maxId);
        expect(orgs[0].id).toBe(minId);
      });

      it('Sort by title DESC', async () => {
        const orderBy = '-title,-id';

        const orgs = await GraphqlHelper.getManyOrgsDataOnlyAsMyself(userVlad, orderBy);

        const [minId, maxId]: [number, number] = await Promise.all([
          OrganizationsRepository.findMinOrgIdByParameter('title'),
          OrganizationsRepository.findMaxOrgIdByParameter('title'),
        ]);

        expect(orgs[orgs.length - 1].id).toBe(minId);
        expect(orgs[0].id).toBe(maxId);
      });
    });
    describe('Test pagination', () => {
      it('Every request should contain correct metadata', async () => {
        const page    = 1;
        const perPage = 2;
        // noinspection JSDeprecatedSymbols
        const response = await GraphqlHelper.getManyOrgsAsMyself(userVlad, '-id', page, perPage);

        const { metadata } = response;

        const totalAmount = await OrganizationsRepository.countAllOrganizations();
        expect(metadata.has_more).toBeTruthy();
        expect(metadata.page).toBe(page);
        expect(metadata.per_page).toBe(perPage);
        expect(metadata.total_amount).toBe(totalAmount);

        const lastPage = totalAmount - perPage;

        // noinspection JSDeprecatedSymbols
        const lastResponse =
          await OrganizationsHelper.requestAllOrgsWithPagination(lastPage, perPage);

        expect(lastResponse.metadata.has_more).toBeFalsy();
      });
      it('Get two post pages', async () => {
        const perPage = 2;
        let page = 1;

        // @ts-ignore
        const params: DbParamsDto = {
          order: [
            ['current_rate', 'DESC'],
            ['id', 'DESC'],
          ],
        };

        const posts = await OrganizationsRepository.findAllOrgForList(params);

        const response = await GraphqlHelper.getManyOrgsAsMyself(userVlad, '-current_rate,-id', page, perPage);
        const firstPage = response.data;

        const expectedIdsOfFirstPage = [
          posts[page - 1].id,
          posts[page].id,
        ];

        expect(firstPage.length).toBe(perPage);

        firstPage.forEach((post, i) => {
          expect(post.id).toBe(expectedIdsOfFirstPage[i]);
        });

        page = 2;
        const secondPageResponse = await GraphqlHelper.getManyOrgsAsMyself(userVlad, '-current_rate,-id', page, perPage);
        const secondPage = secondPageResponse.data;

        const expectedIdsOfSecondPage = [
          posts[page].id,
          posts[page + 1].id,
        ];

        expect(secondPage.length).toBe(perPage);

        secondPage.forEach((post, i) => {
          expect(post.id).toBe(expectedIdsOfSecondPage[i]);
        });
      });
    });
  });
});

export {};
