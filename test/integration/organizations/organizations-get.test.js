const _ = require('lodash');

const helpers                   = require('../helpers');
const OrganizationsRepositories = require('../../../lib/organizations/repository');
const OrgRepository             = require('../../../lib/organizations/repository').Main;

let userVlad;
let userJane;
let userPetr;
let userRokky;

helpers.Mock.mockBlockchainPart();

describe('Organizations. Get requests', () => {
  beforeAll(async ()  => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });
  afterAll(async ()   => { await helpers.SeedsHelper.sequelizeAfterAll(); });
  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Users with organizations data', () => {
    it('should contain organizations list for GET one user by ID', async () => {
      const user_id = userJane.id;

      const model = await helpers.Users.requestToGetUserAsGuest(user_id);
      const organizations = model.organizations;

      expect(organizations).toBeDefined();

      const expectedModels = await OrganizationsRepositories.Main.findAllAvailableForUser(user_id);
      expect(organizations.length).toBe(expectedModels.length);

      organizations.forEach(org => {
        if (org.avatar_filename) {
          expect(org.avatar_filename).toMatch('organizations/');
        }

        delete org.followed_by; // TODO
      });

      expectedModels.forEach(model => {
        expect(organizations.some(org => org.id === model.id)).toBeTruthy();
      });

      helpers.Organizations.checkIncludedOrganizationPreview(model);
    });

    it('should not contain empty organizations array', async () => {
      const model = await helpers.Users.requestToGetUserAsGuest(userRokky.id);

      expect(model.organizations).toBeDefined();
      expect(model.organizations.length).toBe(0);
    });
  });

  describe('Posts with organizations data', () => {
    describe('Single post organization data', () => {
      it('should contain organization data', async () => {
        const post_id = 1;

        const post = await helpers.Post.requestToGetOnePostAsGuest(post_id);
        expect(post.organization_id).toBe(1);

        delete post.organization.followed_by;

        helpers.Org.checkOneOrganizationPreviewFields(post.organization);
      });
    });
  });

  describe('Organization lists', () => {
    describe('Test sorting', async () => {
      it('Sort by current_rate DESC', async () => {
        const queryString = 'sort_by=-current_rate,-id';
        const orgs = await helpers.Org.requestToGetManyOrganizationsAsGuest(queryString);

        const minOrgId = await OrgRepository.findMinOrgIdByParameter('current_rate');
        const maxOrgId = await OrgRepository.findMaxOrgIdByParameter('current_rate');

        expect(orgs[orgs.length - 1].id).toBe(minOrgId);
        expect(orgs[0].id).toBe(maxOrgId);
      });
      it('Sort by current_rate ASC', async () => {
        const queryString = 'sort_by=current_rate,-id';
        const orgs = await helpers.Org.requestToGetManyOrganizationsAsGuest(queryString);

        const minPostId = await OrgRepository.findMinOrgIdByParameter('current_rate');
        const maxOrgId = await OrgRepository.findMaxOrgIdByParameter('current_rate');

        expect(orgs[orgs.length - 1].id).toBe(maxOrgId);
        expect(orgs[0].id).toBe(minPostId);
      });

      it('Sort by title ASC', async () => {
        const queryString = 'sort_by=title,-id';
        const models = await helpers.Org.requestToGetManyOrganizationsAsGuest(queryString);

        const minId = await OrgRepository.findMinOrgIdByParameter('title');
        const maxId = await OrgRepository.findMaxOrgIdByParameter('title');

        expect(models[models.length - 1].id).toBe(maxId);
        expect(models[0].id).toBe(minId);
      });

      it('Sort by title DESC', async () => {
        const queryString = 'sort_by=-title,-id';
        const models = await helpers.Org.requestToGetManyOrganizationsAsGuest(queryString);

        const minId = await OrgRepository.findMinOrgIdByParameter('title');
        const maxId = await OrgRepository.findMaxOrgIdByParameter('title');

        expect(models[models.length - 1].id).toBe(minId);
        expect(models[0].id).toBe(maxId);
      });
    });

    describe('Test pagination', async () => {
      it('Every request should contain correct metadata', async () => {
        const page    = 1;
        const perPage = 2;
        const response = await helpers.Org.requestAllOrgsWithPagination(page, perPage);

        const metadata = response.metadata;

        const totalAmount = await OrgRepository.countAllOrganizations();

        expect(metadata).toBeDefined();
        expect(metadata.has_more).toBeTruthy();
        expect(metadata.page).toBe(page);
        expect(metadata.per_page).toBe(perPage);
        expect(metadata.total_amount).toBe(totalAmount);

        const lastPage = totalAmount - perPage;

        const lastResponse = await helpers.Org.requestAllOrgsWithPagination(lastPage, perPage);

        expect(lastResponse.metadata.has_more).toBeFalsy();
      });

      it('Get two post pages', async () => {
        const perPage = 2;
        let page = 1;

        const posts = await OrgRepository.findAllForPreview({
          'order': [
            ['current_rate', 'DESC'],
            ['id', 'DESC']
          ]
        });
        const firstPage = await helpers.Org.requestAllOrgsWithPagination(page, perPage, true);

        const expectedIdsOfFirstPage = [
          posts[page - 1].id,
          posts[page].id,
        ];

        expect(firstPage.length).toBe(perPage);

        firstPage.forEach((post, i) => {
          expect(post.id).toBe(expectedIdsOfFirstPage[i])
        });

        page = 2;
        const secondPage = await helpers.Org.requestAllOrgsWithPagination(page, perPage, true);

        const expectedIdsOfSecondPage = [
          posts[page].id,
          posts[page + 1].id,
        ];

        expect(secondPage.length).toBe(perPage);

        secondPage.forEach((post, i) => {
          expect(post.id).toBe(expectedIdsOfSecondPage[i])
        });
      });

      it('Page 0 and page 1 behavior must be the same', async () => {
        const perPage = 2;

        const pageIsZeroResponse = await helpers.Org.requestAllOrgsWithPagination(1, perPage, true);
        const pageIsOneResponse = await helpers.Org.requestAllOrgsWithPagination(1, perPage, true);

        expect(JSON.stringify(pageIsZeroResponse)).toBe(JSON.stringify(pageIsOneResponse));
      });
    });

    it('Get organization lists without query string', async () => {
      const totalCount = await OrganizationsRepositories.Main.countAllOrganizations();
      const organizations = await helpers.Organizations.requestToGetManyOrganizationsAsGuest();

      expect(organizations).toBeDefined();
      expect(organizations instanceof Array).toBeTruthy();
      expect(organizations.length).toBe(totalCount);

      organizations.forEach(org => {
        delete org.followed_by; // TODO
      });

      helpers.Organizations.checkOrganizationsPreviewFields(organizations);
    });
  });

  describe('One organization', () => {
    it('Get one organization by ID as guest', async () => {
      const model_id = 1;

      await helpers.Org.createSocialNetworksDirectly(model_id);

      const model = await helpers.Organizations.requestToGetOneOrganizationAsGuest(model_id);

      expect(model).toBeDefined();
      expect(model.id).toBe(model_id);

      helpers.UserHelper.checkIncludedUserPreview(model);

      expect(model.users_team).toBeDefined();
      expect(model.users_team.length).toBeGreaterThan(0);

      expect(model.avatar_filename).toMatch('organizations/');
      expect(model.social_networks).toBeDefined();

      expect(model.current_rate).toBeDefined();
      expect(model.current_rate).not.toBeNull();
    });

    it('should return communities and partnerships', async () => {
      const org_id = 1;

      await helpers.Org.createSampleSourcesForOrganization(org_id);

      const model = await helpers.Organizations.requestToGetOneOrganizationAsGuest(org_id);

      const communitySources = model.community_sources;

      expect(_.isArray(communitySources)).toBeTruthy();
      expect(communitySources.length).toBe(6);

      communitySources.forEach(source => {
        expect(source.source_type).toBeDefined();
        if (source.source_type === 'external') {
          expect(source.avatar_filename).toBeDefined();

          if (source.avatar_filename !== null) {
            expect(source.avatar_filename).toMatch('organizations/');
          }
        }
      });

      expect(_.isArray(model.partnership_sources)).toBeTruthy();
      expect(model.partnership_sources.length).toBe(6);

      expect(_.isArray(model.social_networks)).toBeTruthy();
      expect(model.social_networks.length).toBe(0);



      // TODO check response structure based on field external internal
    });

    it('should not contain myself data if requesting as guest', async () => {
      const model_id = 1;

      const model = await helpers.Organizations.requestToGetOneOrganizationAsGuest(model_id);
      expect(model.myselfData).not.toBeDefined();
    });

    it('should contain myselfData if requesting with token', async () => {
      const model_id = 1;

      const model = await helpers.Organizations.requestToGetOneOrganizationAsMyself(userVlad, model_id);
      const myselfData = model.myselfData;

      expect(myselfData).toBeDefined();

      expect(myselfData.follow).toBeDefined();
      expect(myselfData.editable).toBeDefined();
      expect(myselfData.member).toBeDefined();
    });

    it('should contain myselfData editable false if request not from author', async () => {
      const model_id = await OrganizationsRepositories.Main.findLastIdByAuthor(userVlad.id);
      const model = await helpers.Organizations.requestToGetOneOrganizationAsMyself(userJane, model_id);

      expect(model.myselfData.editable).toBeFalsy();
      expect(model.myselfData.member).toBeFalsy();
    });

    it('should contain myselfData editable true and member true if author request his organization', async () => {
      const user = userVlad;

      const model_id = await OrganizationsRepositories.Main.findLastIdByAuthor(user.id);
      const model = await helpers.Organizations.requestToGetOneOrganizationAsMyself(user, model_id);

      expect(model.myselfData.editable).toBeTruthy();
      expect(model.myselfData.member).toBeTruthy();
    });
  });
});