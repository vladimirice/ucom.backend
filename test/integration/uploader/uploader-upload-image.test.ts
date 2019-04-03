import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import UploaderImagesRequestHelper = require('../../helpers/uploader/uploader-images-request-helper');
import UploaderImagesChecker = require('../../helpers/uploader/uploader-images-checker');

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

let userVlad: UserModel;

// @ts-ignore
const JEST_TIMEOUT = 1000;

// @ts-ignore
const JEST_TIMEOUT_DEBUG = 1000 * 1000;

describe('Uploader - upload one image', () => {
  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });
  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Positive', () => {
    it('upload one jpg image', async () => {
      const body = await UploaderImagesRequestHelper.uploadOneSampleImage(userVlad);

      await UploaderImagesChecker.checkOneFileIsUploaded(body);
    }, JEST_TIMEOUT);

    it('Upload one gif image', async () => {
      // TODO
    }, JEST_TIMEOUT);
  });

  describe('Negative', () => {
    it('Not possible to upload without auth token', async () => {
      await UploaderImagesRequestHelper.uploadOneSampleImage(null, 401);
    });

    it('Not possible to upload png file', async () => {
      // TODO
    });

    it('Not possible to upload very large jpg file', async () => {
      // TODO
    });

    it('Not possible to upload very large gif file', async () => {
      // TODO
    });

    it('Rename png file to jpg and try to upload - should be an error', async () => {
      // TODO
    });
  });
});

export {};
