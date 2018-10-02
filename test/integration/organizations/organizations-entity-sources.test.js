const helpers = require('../helpers');
const OrgModelProvider = require('../../../lib/organizations/service/organizations-model-provider');
const UsersModelProvider = require('../../../lib/users/users-model-provider');
const EntitySourceRepository = require('../../../lib/entities/repository').Sources;

let userVlad;
let userJane;
let userPetr;
let userRokky;

helpers.Org.mockBlockchainPart();

describe('Organizations. Entity source related creation-updating', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Searching for existing community and partnership', async () => {
    describe('Positive scenarios', () => {

      it('Find organizations as community and be case insensitive', async () => {
        const vladIncId = 1;
        const janeIncId = 3;

        const body = await helpers.Org.requestToSearchCommunity('inc');
        expect(body.length).toBe(2);
        expect(body.some(data => data.id === vladIncId && data.entity_name === OrgModelProvider.getEntityName())).toBeTruthy();
        expect(body.some(data => data.id === janeIncId && data.entity_name === OrgModelProvider.getEntityName())).toBeTruthy();

        const expectedFields = [
          'id',
          'entity_name',

          'avatar_filename',
          'nickname',
          'title',
        ];

        helpers.Res.expectAllFieldsExistenceForArray(body, expectedFields);
      });

      it('Find both users and organizations as partnership', async () => {
        const vladIncId = 1;

        const body = await helpers.Org.requestToSearchPartnership('vlad');

        expect(body.length).toBe(4);
        const vladIncFromResponse = body.find(data => data.id === vladIncId);
        const userVladFromResponse = body.find(data => data.id === userVlad.id && data.title === `${userVlad.first_name} ${userVlad.last_name}`);

        expect(vladIncFromResponse).toBeDefined();
        expect(userVladFromResponse).toBeDefined();

        expect(vladIncFromResponse.entity_name).toBe(OrgModelProvider.getEntityName());
        expect(userVladFromResponse.entity_name).toBe(UsersModelProvider.getEntityName());

        const expectedFields = [
          'id',
          'entity_name',

          'avatar_filename',
          'nickname',
          'title',
        ];

        helpers.Res.expectAllFieldsExistenceForArray(body, expectedFields);
      });
    });

    describe('Negative scenarios', () => {
      it('No community if search query match nothing', async () => {
        // TODO
      });

      it('No partnership if search query is wrong', async () => {
        // TODO
      });
    });
  });

  describe('Community and partnership sources', async () => {
    it('should create organization with community and partnership - different kinds of links.', async () => {
      // TODO - provide avatar uploading for external links only
      const user = userVlad;

      // Internal link example
      const communitySourceOrg = {
        id:           "1",
        entity_name:  OrgModelProvider.getEntityName(), // const
        source_type:  'internal',
      };

      const sampleAvatarFile = helpers.FileToUpload.getSampleFilePathToUpload();

      // external link example
      const communitySourceExternal = {
        title: 'External super community',
        description: 'This is a cool description about cool external community',
        source_url: 'https://coolcommunity.com',

        source_type: 'external',
        avatar_filename: sampleAvatarFile, // upload avatar as usual
      };

      // Internal link example
      const partnershipSourceOrg = {
        id:           "2",
        entity_name:  OrgModelProvider.getEntityName(), // fetch this type from API response

        source_type:  'internal',
      };

      const partnershipSourceUsers = {
        id:           "1",
        entity_name:  UsersModelProvider.getEntityName(), // fetch this type from API response
        source_type:  'internal',
      };

      // TODO - check partnership - organization

      const partnershipSourceExternal = {
        // external link example
        title: 'External super partnership',
        description: 'This is a cool description about cool external partnership',
        source_url: 'https://coolpartnership.com',
        source_type: 'external',

        avatar_filename: sampleAvatarFile, // upload avatar as usual
      };

      const sourcesToInsert = {
        'community_sources': [
          communitySourceOrg,
          communitySourceExternal,
        ],
        'partnership_sources': [
          partnershipSourceOrg,
          partnershipSourceExternal,
          partnershipSourceUsers
        ],
      };

      const body = await helpers.Org.requestToCreateNew(user, {}, sourcesToInsert);

      const sources = await EntitySourceRepository.findAllByEntity(body.id, OrgModelProvider.getEntityName());
      expect(sources.length).toBe(5);

      const communitySourceOrgActual = sources.find(data => {
        return data.source_group_id === 2
          && +data.source_entity_id === +communitySourceOrg.id
          && data.source_entity_name === communitySourceOrg.entity_name
      });

      helpers.Res.expectValuesAreExpected({
        entity_id:          "" + body.id,
        entity_name:        OrgModelProvider.getEntityName(),

        source_entity_id:   communitySourceOrg.id,
        source_entity_name: communitySourceOrg.entity_name,

        source_url:         '',
        is_official:        false,
        source_type_id:     null,
        source_group_id:    2, // TODO - from dictionary
        text_data:          '',
      }, communitySourceOrgActual);

      const communitySourceExternalActual = sources.find(data => {
        return data.source_group_id === 2
          && data.source_url === communitySourceExternal.source_url
      });

      helpers.Res.expectValuesAreExpected({
        entity_id:          "" + body.id,
        entity_name:        OrgModelProvider.getEntityName(),

        source_entity_id:   null,
        source_entity_name: null,

        source_url:         communitySourceExternal.source_url,
        is_official: false,
        source_type_id: null,
        source_group_id: 2, // TODO - from dictionary
        text_data: JSON.stringify({'title': communitySourceExternal.title, 'description': communitySourceExternal.description}),

      }, communitySourceExternalActual);

      const partnershipSourceInternalActual = sources.find(data => {
        return data.source_group_id === 3
          && +data.source_entity_id === +partnershipSourceOrg.id
          && data.source_entity_name === partnershipSourceOrg.entity_name
      });

      helpers.Res.expectValuesAreExpected({
        entity_id:          "" + body.id,
        entity_name:        OrgModelProvider.getEntityName(),

        source_entity_id:   partnershipSourceOrg.id,
        source_entity_name: partnershipSourceOrg.entity_name,

        source_url:         '',
        is_official:        false,
        source_type_id:     null,
        source_group_id:    3, // TODO - from dictionary
        text_data:          '',
      }, partnershipSourceInternalActual);

      const partnershipSourceExternalActual = sources.find(data => {
        return data.source_group_id === 3 // TODO
          && data.source_url === partnershipSourceExternal.source_url
      });

      helpers.Res.expectValuesAreExpected({
        entity_id:          "" + body.id,
        entity_name:        OrgModelProvider.getEntityName(),

        source_entity_id:   null,
        source_entity_name: null,

        source_url:         partnershipSourceExternal.source_url,
        is_official:        false,
        source_type_id:     null,
        source_group_id:    3, // TODO - from dictionary
        text_data:          JSON.stringify({'title': partnershipSourceExternal.title, 'description': partnershipSourceExternal.description}),
      }, partnershipSourceExternalActual);

      const partnershipSourceUserInternalActual = sources.find(data => {
        return data.source_group_id === 3
          && +data.source_entity_id === +partnershipSourceUsers.id
          && data.source_entity_name === partnershipSourceUsers.entity_name
      });

      helpers.Res.expectValuesAreExpected({
        entity_id:          "" + body.id,
        entity_name:        OrgModelProvider.getEntityName(),

        source_entity_id:   partnershipSourceUsers.id,
        source_entity_name: partnershipSourceUsers.entity_name,

        source_url:         '',
        is_official:        false,
        source_type_id:     null,
        source_group_id:    3, // TODO - from dictionary
        text_data:          '',
      }, partnershipSourceUserInternalActual);
    });

    it('should create sources separately', async () => {
      // TODO
    });

    it('should add more and delete some organization communities and partnerships', async () => {
      // TODO
    });

    it('should add different sources to get one organization response', async () => {
      // TODO
    });
  });

  describe('Negative scenarios', () => {
    it('should not be possible to update community and partnership by ID which is not belong to current organization', async () => {
      // TODO
    });
  });
});