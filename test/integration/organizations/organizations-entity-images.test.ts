import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { OrgModel } from '../../../lib/organizations/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import OrganizationsHelper = require('../helpers/organizations-helper');

import EntityImagesChecker = require('../../helpers/entity-images/entity-images-checker');
import EntityImagesGenerator = require('../../generators/common/entity-images-generator');

let userVlad: UserModel;

const JEST_TIMEOUT = 5000;

describe('organizations entity images', () => {
  beforeAll(async () => {
    await SeedsHelper.withGraphQlMockAllWorkers();
  });
  afterAll(async () => {
    await SeedsHelper.afterAllWithGraphQl();
  });
  beforeEach(async () => {
    [userVlad] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Creation', () => {
    describe('Positive', () => {
      it('Create organizations without entity_images', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

        const organization: OrgModel = await OrganizationsHelper.requestToGetOneOrganizationAsGuest(orgId);

        EntityImagesChecker.checkIsEmptyForOneModel(organization);
      }, JEST_TIMEOUT);

      it('Create organization with passing entity images', async () => {
        const orgId = await OrganizationsGenerator.createOrganizationWithEntityImages(userVlad);

        const organization: OrgModel = await OrganizationsHelper.requestToGetOneOrganizationAsGuest(orgId);

        EntityImagesChecker.checkSampleEntityImagesForModel(organization);
      }, JEST_TIMEOUT);
    });
  });

  describe('Updating', () => {
    it('create without entity_images and add them by updating', async () => {
      const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

      const fields = EntityImagesGenerator.getObjectWithEntityImages();

      await OrganizationsHelper.updateOneOrganization(orgId, userVlad, fields);

      const organization = await OrganizationsHelper.requestToGetOneOrganizationAsGuest(orgId);
      EntityImagesChecker.checkSampleEntityImagesForModel(organization);
    });

    it('create without entity_images and update also without ones', async () => {
      const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

      await OrganizationsHelper.updateOneOrganization(orgId, userVlad, []);

      const organization = await OrganizationsHelper.requestToGetOneOrganizationAsGuest(orgId);
      EntityImagesChecker.checkIsEmptyForOneModel(organization);
    });

    it('create with entity_images and clear by updating (provide nothing)', async () => {
      const orgId = await OrganizationsGenerator.createOrganizationWithEntityImages(userVlad);

      await OrganizationsHelper.updateOneOrganization(orgId, userVlad, []);

      const organization = await OrganizationsHelper.requestToGetOneOrganizationAsGuest(orgId);
      EntityImagesChecker.checkIsEmptyForOneModel(organization);
    });
  });

  describe('Get with and without entity_images', () => {
    it('get one with empty entity_images', async () => {
      const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

      const organization = await OrganizationsHelper.requestToGetOneOrganizationAsGuest(orgId);
      EntityImagesChecker.checkIsEmptyForOneModel(organization);
    });

    it('get one with filled entity_images', async () => {
      const orgId = await OrganizationsGenerator.createOrganizationWithEntityImages(userVlad);

      const organization = await OrganizationsHelper.requestToGetOneOrganizationAsGuest(orgId);
      EntityImagesChecker.checkSampleEntityImagesForModel(organization);
    });
  });
});

export {};
