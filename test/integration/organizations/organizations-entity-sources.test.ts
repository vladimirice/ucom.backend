/* eslint-disable max-len */
import MockHelper = require('../helpers/mock-helper');
import SeedsHelper = require('../helpers/seeds-helper');
import OrganizationsHelper = require('../helpers/organizations-helper');
import ResponseHelper = require('../helpers/response-helper');
import FileToUploadHelper = require('../helpers/file-to-upload-helper');
import EntitySourcesRepository = require('../../../lib/entities/repository/entity-sources-repository');
import OrganizationsRepository = require('../../../lib/organizations/repository/organizations-repository');

const orgModelProvider = require('../../../lib/organizations/service/organizations-model-provider');
const usersModelProvider = require('../../../lib/users/users-model-provider');

let userVlad;

MockHelper.mockAllBlockchainPart();

describe('Organizations. Entity source related creation-updating', () => {
  beforeAll(async () => {
    [userVlad] = await SeedsHelper.beforeAllRoutine();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    await SeedsHelper.resetOrganizationRelatedSeeds();
  });

  describe('Searching for existing community and partnership', () => {
    describe('Positive scenarios', () => {
      it('Find organizations as community and be case insensitive', async () => {
        const vladIncId = 1;
        const janeIncId = 3;

        const body = await OrganizationsHelper.requestToSearchCommunity('inc');
        expect(body.length).toBe(2);
        expect(body.some(data => data.entity_id === vladIncId
          && data.entity_name === orgModelProvider.getEntityName())).toBeTruthy();
        expect(body.some(data => data.entity_id === janeIncId
          && data.entity_name === orgModelProvider.getEntityName())).toBeTruthy();

        const expectedFields = [
          'entity_id',
          'entity_name',
          'current_rate',

          'avatar_filename',
          'nickname',
          'title',
          'user_id',
          'about',
          'powered_by',
        ];

        ResponseHelper.expectAllFieldsExistenceForArray(body, expectedFields);

        body.forEach((model) => {
          OrganizationsHelper.checkIsPostProcessedSmell(model);
        });
      });

      it('Find both users and organizations as partnership', async () => {
        const vladIncId = 1;

        const body = await OrganizationsHelper.requestToSearchPartnership('vlad');

        expect(body.length).toBe(4);
        const vladIncFromResponse = body.find(data => data.entity_id === vladIncId);
        const userVladFromResponse = body.find(data => data.entity_id === userVlad.id
          && data.title === `${userVlad.first_name} ${userVlad.last_name}`);

        expect(vladIncFromResponse).toBeDefined();
        expect(userVladFromResponse).toBeDefined();

        expect(vladIncFromResponse.entity_name).toBe(orgModelProvider.getEntityName());
        expect(userVladFromResponse.entity_name).toBe(usersModelProvider.getEntityName());

        OrganizationsHelper.checkIsPostProcessedSmell(vladIncFromResponse);

        const expectedFields = [
          'entity_id',
          'entity_name',
          'current_rate',

          'avatar_filename',
          'nickname',
          'title',
        ];

        body.forEach((model) => {
          delete model.user_id;
        });

        ResponseHelper.expectAllFieldsExistenceForArray(body, expectedFields);
      });
    });

    describe('Negative scenarios', () => {
      it.skip('No community if search query match nothing', async () => {
      });

      it.skip('No partnership if search query is wrong', async () => {
      });
    });
  });

  describe('Community and partnership sources', () => {
    // tslint:disable-next-line:max-line-length
    it('should create organization with community and partnership - different kinds of links.', async () => {
      // #task - provide avatar uploading for external links only
      const user = userVlad;

      // Internal link example
      const communitySourceOrg = {
        entity_id:           '1',
        entity_name:  orgModelProvider.getEntityName(), // const
        source_type:  'internal',
      };

      const sampleAvatarFile = FileToUploadHelper.getSampleFilePathToUpload();

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
        entity_id:           '2',
        entity_name:  orgModelProvider.getEntityName(), // fetch this type from API response

        source_type:  'internal',
      };

      const partnershipSourceUsers = {
        entity_id:           '1',
        entity_name:  usersModelProvider.getEntityName(), // fetch this type from API response
        source_type:  'internal',
      };

      const partnershipSourceExternal = {
        // external link example
        title: 'External super partnership',
        description: 'This is a cool description about cool external partnership',
        source_url: 'https://coolpartnership.com',
        source_type: 'external',

        avatar_filename: sampleAvatarFile, // upload avatar as usual
      };

      const sourcesToInsert = {
        community_sources: [
          communitySourceOrg,
          communitySourceExternal,
        ],
        partnership_sources: [
          partnershipSourceOrg,
          partnershipSourceExternal,
          partnershipSourceUsers,
        ],
      };

      const body = await OrganizationsHelper.requestToCreateNew(user, {}, sourcesToInsert);

      const sources =
        await EntitySourcesRepository.findAllByEntity(body.id, orgModelProvider.getEntityName());
      expect(sources.length).toBe(5);

      const communitySourceOrgActual = sources.find(data => data.source_group_id === 2
          && +data.source_entity_id === +communitySourceOrg.entity_id
          && data.source_entity_name === communitySourceOrg.entity_name);

      ResponseHelper.expectValuesAreExpected({
        entity_id:          `${body.id}`,
        entity_name:        orgModelProvider.getEntityName(),

        source_entity_id:   communitySourceOrg.entity_id,
        source_entity_name: communitySourceOrg.entity_name,

        source_url:         '',
        is_official:        false,
        source_type_id:     null,
        source_group_id:    2, // #task - from dictionary
        text_data:          '',
      },                                  communitySourceOrgActual);

      const communitySourceExternalActual = sources.find(data => data.source_group_id === 2
          && data.source_url === communitySourceExternal.source_url);

      expect(communitySourceExternalActual.avatar_filename).toBeDefined();
      expect(communitySourceExternalActual.avatar_filename).not.toBeNull();
      await OrganizationsHelper.isAvatarImageUploaded(communitySourceExternalActual.avatar_filename);

      // #task check if uploaded

      const textData = JSON.stringify(
        { title: communitySourceExternal.title, description: communitySourceExternal.description },
      );

      ResponseHelper.expectValuesAreExpected({
        entity_id:          `${body.id}`,
        entity_name:        orgModelProvider.getEntityName(),

        source_entity_id:   null,
        source_entity_name: null,

        source_url:         communitySourceExternal.source_url,
        is_official: false,
        source_type_id: null,
        source_group_id: 2, // #task - from dictionary
        text_data: textData,

      },                                  communitySourceExternalActual);

      const partnershipSourceInternalActual = sources.find(data => data.source_group_id === 3
          && +data.source_entity_id === +partnershipSourceOrg.entity_id
          && data.source_entity_name === partnershipSourceOrg.entity_name);

      ResponseHelper.expectValuesAreExpected({
        entity_id:          `${body.id}`,
        entity_name:        orgModelProvider.getEntityName(),

        source_entity_id:   partnershipSourceOrg.entity_id,
        source_entity_name: partnershipSourceOrg.entity_name,

        source_url:         '',
        is_official:        false,
        source_type_id:     null,
        source_group_id:    3,
        text_data:          '',
      },                                  partnershipSourceInternalActual);

      const partnershipSourceExternalActual = sources.find(data => data.source_group_id === 3
          && data.source_url === partnershipSourceExternal.source_url);

      const textDataTwo = JSON.stringify(
        {
          title: partnershipSourceExternal.title,
          description: partnershipSourceExternal.description,
        },
      );

      ResponseHelper.expectValuesAreExpected({
        entity_id:          `${body.id}`,
        entity_name:        orgModelProvider.getEntityName(),

        source_entity_id:   null,
        source_entity_name: null,

        source_url:         partnershipSourceExternal.source_url,
        is_official:        false,
        source_type_id:     null,
        source_group_id:    3,
        text_data:          textDataTwo,
      },                                  partnershipSourceExternalActual);

      expect(partnershipSourceExternalActual.avatar_filename).toBeDefined();
      expect(partnershipSourceExternalActual.avatar_filename).not.toBeNull();
      await OrganizationsHelper.isAvatarImageUploaded(partnershipSourceExternalActual.avatar_filename);

      const partnershipSourceUserInternalActual = sources.find(data => data.source_group_id === 3
          && +data.source_entity_id === +partnershipSourceUsers.entity_id
          && data.source_entity_name === partnershipSourceUsers.entity_name);

      ResponseHelper.expectValuesAreExpected({
        entity_id:          `${body.id}`,
        entity_name:        orgModelProvider.getEntityName(),

        source_entity_id:   partnershipSourceUsers.entity_id,
        source_entity_name: partnershipSourceUsers.entity_name,

        source_url:         '',
        is_official:        false,
        source_type_id:     null,
        source_group_id:    3,
        text_data:          '',
      },                                  partnershipSourceUserInternalActual);

      const org = await OrganizationsHelper.requestToGetOneOrganizationAsGuest(body.id);

      org.partnership_sources.forEach((model) => {
        if (model.entity_name === orgModelProvider.getEntityName()) {
          OrganizationsHelper.checkIsPostProcessedSmell(model);
        }
      });

      org.community_sources.forEach((model) => {
        OrganizationsHelper.checkIsPostProcessedSmell(model);
      });
    });

    it.skip('should create sources separately', async () => {
    });

    it('should add more and delete some organization communities and partnerships', async () => {
      const user = userVlad;
      const orgId = await OrganizationsRepository.findFirstIdByAuthorId(user.id);
      await OrganizationsHelper.createSampleSourcesForOrganization(orgId);

      const sources = await OrganizationsHelper.requestToGetOneOrganizationAsGuest(orgId);

      const partnershipSourcesSet = OrganizationsHelper.prepareSourceForUpdating(
        sources.partnership_sources,
      );
      const communitySourcesSet = OrganizationsHelper.prepareSourceForUpdating(
        sources.community_sources,
      );

      const sourceForRequest: any = {
        community_sources:    communitySourcesSet.for_request,
        partnership_sources: partnershipSourcesSet.for_request,
      };

      // #task - it is required to provide these fields on update. Fix it later
      const fieldsToUpdate = {
        title: 'newTitle',
        nickname: 'new_nick_nick_name',
      };

      await OrganizationsHelper.requestToUpdateExisting(orgId, user, fieldsToUpdate, sourceForRequest);
      const orgAfter = await OrganizationsHelper.requestToGetOneOrganizationAsGuest(orgId);

      await OrganizationsHelper.checkSourcesAfterUpdating(
        orgAfter.partnership_sources,
        partnershipSourcesSet,
      );
      await OrganizationsHelper.checkSourcesAfterUpdating(
        orgAfter.community_sources,
        communitySourcesSet,
      );
    });

    it.skip('should update existing external source avatar filename', async () => {
    });
  });

  describe('Negative scenarios', () => {
    // tslint:disable-next-line:max-line-length
    it.skip('should not be possible to update community and partnership by ID which is not belong to current organization', async () => {
    });

    it.skip('should not be possible to save malformed pair entity_id + entity_name', async () => {
    });
  });
});

export {};
