import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';
import { StringToAnyCollection } from '../../../../lib/common/interfaces/common-types';

import SeedsHelper = require('../../helpers/seeds-helper');
import EntityImagesGenerator = require('../../../generators/common/entity-images-generator');
import OneUserRequestHelper = require('../../../helpers/users/one-user-request-helper');
import EntityImagesChecker = require('../../../helpers/entity-images/entity-images-checker');

let userVlad: UserModel;
// @ts-ignore
let userJane: UserModel;

const JEST_TIMEOUT = 5000;

// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

describe('Myself entity images', () => {
  beforeAll(async () => {
    await SeedsHelper.withGraphQlMockAllWorkers();
  });
  afterAll(async () => {
    await SeedsHelper.afterAllWithGraphQl();
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Update myself with entity images', () => {
    it('Update Myself and also update entity_images. From empty to filled', async () => {
      const fieldsToChange: StringToAnyCollection = {
        first_name: 'vladislav',
        ...EntityImagesGenerator.getObjectWithEntityImages(),
      };

      const updatedVlad: UserModel = await OneUserRequestHelper.updateMyself(userVlad, fieldsToChange);

      expect(updatedVlad.first_name).toBe(fieldsToChange.first_name);
      EntityImagesChecker.checkForOneModel(updatedVlad, fieldsToChange.entity_images);
    });

    it('allow undefined entity_images', async () => {
      const fieldsToChange: StringToAnyCollection = {
        first_name: 'vladislav',
      };

      const updatedVlad: UserModel = await OneUserRequestHelper.updateMyself(userVlad, fieldsToChange);

      expect(updatedVlad.first_name).toBe(fieldsToChange.first_name);
      EntityImagesChecker.checkIsEmptyForOneModel(updatedVlad);
    });

    it('set entity images and then clear it', async () => {
      await OneUserRequestHelper.setSampleEntityImages(userVlad);

      const fieldsToChange: StringToAnyCollection = {
        entity_images: {},
      };

      const updatedVladAfter: UserModel = await OneUserRequestHelper.updateMyself(userVlad, fieldsToChange);

      EntityImagesChecker.checkIsEmptyForOneModel(updatedVladAfter);
    });
  });

  describe('Get one user with entity_images', () => {
    it('get myself with empty entity_images', async () => {
      const userVladResponse = await OneUserRequestHelper.getMyself(userVlad);

      EntityImagesChecker.checkIsEmptyForOneModel(<UserModel>userVladResponse);
    });

    it('get myself with filled entity_images', async () => {
      const userVladFromPatch = await OneUserRequestHelper.setSampleEntityImages(userVlad);
      const userVladResponse = await OneUserRequestHelper.getMyself(userVlad);

      EntityImagesChecker.checkForOneModel(<UserModel>userVladResponse, userVladFromPatch.entity_images);
    });

    it('get one user via GraphQL with empty entity names', async () => {
      const filters = {
        user_identity: userVlad.account_name,
      };

      const userVladResponse = await OneUserRequestHelper.getOneUserAsMyself(
        userJane,
        userVlad.id,
        filters,
      );

      EntityImagesChecker.checkIsEmptyForOneModel(<UserModel>userVladResponse);
    });

    it('get one user via GraphQL with filled entity names', async () => {
      const userVladFromPatch = await OneUserRequestHelper.setSampleEntityImages(userVlad);

      const filters = {
        user_identity: userVlad.account_name,
      };

      const userVladResponse = await OneUserRequestHelper.getOneUserAsMyself(
        userJane,
        userVlad.id,
        filters,
      );

      EntityImagesChecker.checkForOneModel(<UserModel>userVladResponse, userVladFromPatch.entity_images);
    });
  });
});

export {};
