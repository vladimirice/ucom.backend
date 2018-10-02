const helpers = require('../helpers');
const OrganizationsRepositories = require('../../../lib/organizations/repository');

const models = require('../../../models');
const _ = require('lodash');

let userVlad;
let userJane;
let userPetr;
let userRokky;

describe('Organizations. Get requests', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => { await helpers.SeedsHelper.sequelizeAfterAll(); });

  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Organization feed', () => {
    it('should get organizations posts for the feed', async () => {
      const org_id = 1;
      const postsResponse = await helpers.Org.requestToGetOrgPosts(org_id);

      const posts = postsResponse.data;

      expect(posts.length).toBe(2);

      posts.forEach(post => {
        expect(post.User).toBeDefined();
        expect(post.organization).toBeDefined();

        expect(post.organization.avatar_filename).toMatch('organizations/');
      });
    });
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

  describe('Organization lists', () => {
    it('Get organization lists without query string', async () => {
      const totalCount = await OrganizationsRepositories.Main.countAllOrganizations();
      const organizations = await helpers.Organizations.requestToGetOrganizationsAsGuest();

      expect(organizations).toBeDefined();
      expect(organizations instanceof Array).toBeTruthy();
      expect(organizations.length).toBe(totalCount);

      helpers.Organizations.checkOrganizationsPreviewFields(organizations);
    });
  });

  describe('One organization', () => {
    it('should return communities and partnerships', async () => {

      const org_id = 1;

      const toInsert = [
        {
          source_url: '',
          is_official: false,
          source_type_id: null,
          source_group_id: 2,
          entity_id: org_id,
          entity_name: 'org       ',

          source_entity_id: 1,
          source_entity_name: 'org       ',
          text_data: ""
        },
        {
          source_url: 'https://coolcommunity.com',
          is_official: false,
          source_type_id: null,
          source_group_id: 2,
          entity_id: org_id,
          entity_name: 'org       ',

          source_entity_id: null,
          source_entity_name: null,
          text_data: '{"title":"External super community","description":"This is a cool description about cool external community"}',
        },
        {
          source_url: '',
          is_official: false,
          source_type_id: null,
          source_group_id: 3,
          entity_id: org_id,
          entity_name: 'org       ',

          source_entity_id: 2,
          source_entity_name: 'org       ',
          text_data: '',
        },
        {
          source_url: 'https://coolpartnership.com',
          is_official: false,
          source_type_id: null,
          source_group_id: 3,
          entity_id: org_id,
          entity_name: 'org       ',

          source_entity_id: null,
          source_entity_name: null,
          text_data: '{"title":"External super partnership","description":"This is a cool description about cool external partnership"}',
        },
        {
          source_url: '',
          is_official: false,
          source_type_id: null,
          source_group_id: 3,
          entity_id: org_id,
          entity_name: 'org       ',

          source_entity_id: 1,
          source_entity_name: 'users     ',
          text_data: '',
        },
    ];

      await models.entity_sources.bulkCreate(toInsert);

      const model = await helpers.Organizations.requestToGetOneOrganizationAsGuest(org_id);

      expect(_.isArray(model.community_sources)).toBeTruthy();
      expect(model.community_sources.length).toBe(2);

      expect(_.isArray(model.partnership_sources)).toBeTruthy();
      expect(model.partnership_sources.length).toBe(3);

      expect(_.isArray(model.social_networks)).toBeTruthy();
      expect(model.social_networks.length).toBe(0);

      // TODO check response structure based on field external internal
    });


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