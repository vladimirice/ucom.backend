export {};

const _   = require('lodash');
const gen = require('../../generators');

const helpers                   = require('../helpers');
const organizationsRepositories = require('../../../lib/organizations/repository');
const orgRepository             = require('../../../lib/organizations/repository').Main;

let userVlad;
let userJane;
let userPetr;
let userRokky;

helpers.Mock.mockAllBlockchainPart();

describe('Organizations. Get requests', () => {
  beforeAll(async ()  => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });
  afterAll(async ()   => { await helpers.SeedsHelper.sequelizeAfterAll(); });
  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Users with organizations data', () => {
    describe('Positive', () => {
      it('should contain organizations list for GET one user by ID', async () => {
        const userId = userJane.id;

        const model = await helpers.Users.requestToGetUserAsGuest(userId);
        const organizations = model.organizations;

        expect(organizations).toBeDefined();

        const expectedModels = await organizationsRepositories.Main.findAllAvailableForUser(userId);
        expect(organizations.length).toBe(expectedModels.length);

        organizations.forEach((org) => {
          if (org.avatar_filename) {
            expect(org.avatar_filename).toMatch('organizations/');
          }

          delete org.followed_by;
        });

        expectedModels.forEach((model) => {
          expect(organizations.some(org => org.id === model.id)).toBeTruthy();
        });

        helpers.Organizations.checkIncludedOrganizationPreview(model);
      });
    });

    describe('Negative', () => {
      it('should NOT contain organizations which invitation for you is still pending', async () => {
        const team = [
          userVlad,
          userPetr,
        ];

        const orgId = await gen.Org.createOrgWithTeam(userJane, team);

        const model = await helpers.Users.requestToGetUserAsGuest(userVlad.id);
        const organizations = model.organizations;

        expect(organizations.some(org => org.id === orgId)).toBeFalsy();
      });

      it.skip('should NOT contain organizations which invitation you declined', () => {
      });

      it('should not contain empty organizations array', async () => {
        const model = await helpers.Users.requestToGetUserAsGuest(userRokky.id);

        expect(model.organizations).toBeDefined();
        expect(model.organizations.length).toBe(0);
      });
    });
  });
  describe('Posts with organizations data', () => {
    describe('Single post organization data', () => {
      it('should contain organization data', async () => {
        const postId = 1;

        const post = await helpers.Post.requestToGetOnePostAsGuest(postId);
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

        const minOrgId = await orgRepository.findMinOrgIdByParameter('current_rate');
        const maxOrgId = await orgRepository.findMaxOrgIdByParameter('current_rate');

        expect(orgs[orgs.length - 1].id).toBe(minOrgId);
        expect(orgs[0].id).toBe(maxOrgId);
      });
      it('Sort by current_rate ASC', async () => {
        const queryString = 'sort_by=current_rate,-id';
        const orgs = await helpers.Org.requestToGetManyOrganizationsAsGuest(queryString);

        const minPostId = await orgRepository.findMinOrgIdByParameter('current_rate');
        const maxOrgId = await orgRepository.findMaxOrgIdByParameter('current_rate');

        expect(orgs[orgs.length - 1].id).toBe(maxOrgId);
        expect(orgs[0].id).toBe(minPostId);
      });

      it('Sort by title ASC', async () => {
        const queryString = 'sort_by=title,-id';
        const models = await helpers.Org.requestToGetManyOrganizationsAsGuest(queryString);

        const minId = await orgRepository.findMinOrgIdByParameter('title');
        const maxId = await orgRepository.findMaxOrgIdByParameter('title');

        expect(models[models.length - 1].id).toBe(maxId);
        expect(models[0].id).toBe(minId);
      });

      it('Sort by title DESC', async () => {
        const queryString = 'sort_by=-title,-id';
        const models = await helpers.Org.requestToGetManyOrganizationsAsGuest(queryString);

        const minId = await orgRepository.findMinOrgIdByParameter('title');
        const maxId = await orgRepository.findMaxOrgIdByParameter('title');

        expect(models[models.length - 1].id).toBe(minId);
        expect(models[0].id).toBe(maxId);
      });
    });
    describe('Test pagination', async () => {
      it('Every request should contain correct metadata', async () => {
        const page    = 1;
        const perPage = 2;
        // noinspection JSDeprecatedSymbols
        const response = await helpers.Org.requestAllOrgsWithPagination(page, perPage);

        const metadata = response.metadata;

        const totalAmount = await orgRepository.countAllOrganizations();

        expect(metadata).toBeDefined();
        expect(metadata.has_more).toBeTruthy();
        expect(metadata.page).toBe(page);
        expect(metadata.per_page).toBe(perPage);
        expect(metadata.total_amount).toBe(totalAmount);

        const lastPage = totalAmount - perPage;

        // noinspection JSDeprecatedSymbols
        const lastResponse = await helpers.Org.requestAllOrgsWithPagination(lastPage, perPage);

        expect(lastResponse.metadata.has_more).toBeFalsy();
      });

      it('Get two post pages', async () => {
        const perPage = 2;
        let page = 1;

        const posts = await orgRepository.findAllOrgForList({
          order: [
            ['current_rate', 'DESC'],
            ['id', 'DESC'],
          ],
        });
        // noinspection JSDeprecatedSymbols
        const firstPage = await helpers.Org.requestAllOrgsWithPagination(page, perPage, true);

        const expectedIdsOfFirstPage = [
          posts[page - 1].id,
          posts[page].id,
        ];

        expect(firstPage.length).toBe(perPage);

        firstPage.forEach((post, i) => {
          expect(post.id).toBe(expectedIdsOfFirstPage[i]);
        });

        page = 2;
        // noinspection JSDeprecatedSymbols
        const secondPage = await helpers.Org.requestAllOrgsWithPagination(page, perPage, true);

        const expectedIdsOfSecondPage = [
          posts[page].id,
          posts[page + 1].id,
        ];

        expect(secondPage.length).toBe(perPage);

        secondPage.forEach((post, i) => {
          expect(post.id).toBe(expectedIdsOfSecondPage[i]);
        });
      });

      it('Page 0 and page 1 behavior must be the same', async () => {
        const perPage = 2;

        // noinspection JSDeprecatedSymbols
        const pageIsZeroResponse = await helpers.Org.requestAllOrgsWithPagination(1, perPage, true);
        // noinspection JSDeprecatedSymbols
        const pageIsOneResponse = await helpers.Org.requestAllOrgsWithPagination(1, perPage, true);

        expect(JSON.stringify(pageIsZeroResponse)).toBe(JSON.stringify(pageIsOneResponse));
      });
    });

    it('Get organization lists without query string', async () => {
      const totalCount = await organizationsRepositories.Main.countAllOrganizations();
      const organizations = await helpers.Organizations.requestToGetManyOrganizationsAsGuest();

      expect(organizations).toBeDefined();
      expect(organizations instanceof Array).toBeTruthy();
      expect(organizations.length).toBe(totalCount);

      organizations.forEach((org) => {
        delete org.followed_by;
      });

      helpers.Organizations.checkOrganizationsPreviewFields(organizations);
    });
  });

  describe('One organization', () => {

    it('followed_by users inside one org should be normalized', async () => {
      const orgId = await gen.Org.createOrgWithoutTeam(userVlad);

      await helpers.Activity.requestToFollowOrganization(orgId, userJane);

      const org = await helpers.Organizations.requestToGetOneOrganizationAsGuest(orgId);

      org.followed_by.forEach((user) => {
        helpers.Users.checkIncludedUserPreview({
          User: user,
        });
      });
    });

    it('Get one organization by ID as guest', async () => {
      const modelId = await gen.Org.createOrgWithTeam(userVlad, [userJane, userPetr]);

      await helpers.Users.directlySetUserConfirmsInvitation(modelId, userJane);

      await helpers.Org.createSocialNetworksDirectly(modelId);

      const model = await helpers.Organizations.requestToGetOneOrganizationAsGuest(modelId);

      expect(model).toBeDefined();
      expect(model.id).toBe(modelId);

      helpers.UserHelper.checkIncludedUserPreview(model);

      expect(model.users_team).toBeDefined();
      expect(model.users_team.length).toBeGreaterThan(0);

      expect(model.social_networks).toBeDefined();

      expect(model.current_rate).toBeDefined();
      expect(model.current_rate).not.toBeNull();
    });

    it('should return communities and partnerships', async () => {
      const orgId = 1;

      await helpers.Org.createSampleSourcesForOrganization(orgId);

      const model = await helpers.Organizations.requestToGetOneOrganizationAsGuest(orgId);

      const communitySources = model.community_sources;

      expect(_.isArray(communitySources)).toBeTruthy();
      expect(communitySources.length).toBe(6);

      communitySources.forEach((source) => {
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

      // #task check response structure based on field external internal
    });

    it('should not contain myself data if requesting as guest', async () => {
      const modelId = 1;

      const model = await helpers.Organizations.requestToGetOneOrganizationAsGuest(modelId);
      expect(model.myselfData).not.toBeDefined();
    });

    it('should contain myselfData if requesting with token', async () => {
      const modelId = 1;

      const model =
        await helpers.Organizations.requestToGetOneOrganizationAsMyself(userVlad, modelId);
      const myselfData = model.myselfData;

      expect(myselfData).toBeDefined();

      expect(myselfData.follow).toBeDefined();
      expect(myselfData.editable).toBeDefined();
      expect(myselfData.member).toBeDefined();
    });

    // tslint:disable-next-line:max-line-length
    it('should contain myselfData editable true and member true if author request his organization', async () => {
      const user = userVlad;

      const modelId = await organizationsRepositories.Main.findLastIdByAuthor(user.id);
      const model = await helpers.Organizations.requestToGetOneOrganizationAsMyself(user, modelId);

      expect(model.myselfData.editable).toBeTruthy();
      expect(model.myselfData.member).toBeTruthy();
    });

    // tslint:disable-next-line:max-line-length
    it('should contain myselfData member true if user is not author but organization team member', async () => {
      const orgId = await gen.Org.createOrgWithTeam(userJane, [
        userVlad, userPetr,
      ]);

      await helpers.Users.directlySetUserConfirmsInvitation(orgId, userVlad);

      // tslint:disable-next-line:max-line-length
      const model = await helpers.Organizations.requestToGetOneOrganizationAsMyself(userVlad, orgId);
      expect(model.myselfData.editable).toBeFalsy();
      expect(model.myselfData.member).toBeTruthy();
    });

    describe('Negative', () => {
      it('should NOT contain user in board if invitation status is not confirmed', async () => {
        const orgId = await gen.Org.createOrgWithTeam(userJane, [
          userVlad, userPetr,
        ]);

        await helpers.Users.directlySetUserConfirmsInvitation(orgId, userPetr);

        const model =
          await helpers.Organizations.requestToGetOneOrganizationAsMyself(userVlad, orgId);

        const usersTeam = model.users_team;
        expect(usersTeam.some(user => user.id === userVlad.id
          && user.users_team_status === 1)).toBeFalsy();
        expect(usersTeam.some(user => user.id === userPetr.id)).toBeTruthy();
      });

      // tslint:disable-next-line:max-line-length
      it('should not contain myselfData member true if user invitation request is not confirmed', async () => {
        const orgId = await gen.Org.createOrgWithTeam(userJane, [
          userVlad, userPetr,
        ]);

        await helpers.Users.directlySetUserConfirmsInvitation(orgId, userPetr);

        const model =
          await helpers.Organizations.requestToGetOneOrganizationAsMyself(userVlad, orgId);

        expect(model.myselfData.editable).toBeFalsy();
        expect(model.myselfData.member).toBeFalsy();

        // Smoke test
        const modelByPetr =
          await helpers.Organizations.requestToGetOneOrganizationAsMyself(userPetr, orgId);
        expect(modelByPetr.myselfData.editable).toBeFalsy();
        expect(modelByPetr.myselfData.member).toBeTruthy();
      });

      it('should contain myselfData editable false if request not from author', async () => {
        const modelId = await organizationsRepositories.Main.findLastIdByAuthor(userVlad.id);
        const model =
          await helpers.Organizations.requestToGetOneOrganizationAsMyself(userJane, modelId);

        expect(model.myselfData.editable).toBeFalsy();
        expect(model.myselfData.member).toBeFalsy();
      });
    });
  });
});
