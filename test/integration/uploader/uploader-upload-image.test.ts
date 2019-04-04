import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import UploaderImagesRequestHelper = require('../../helpers/uploader/uploader-images-request-helper');
import UploaderImagesChecker = require('../../helpers/uploader/uploader-images-checker');
import FileToUploadHelper = require('../helpers/file-to-upload-helper');

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

let userVlad: UserModel;

const JEST_TIMEOUT = 5000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 1000;

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
      const imagePath: string = FileToUploadHelper.getSampleJpgPath();
      const body = await UploaderImagesRequestHelper.uploadOneSampleImage(imagePath, userVlad);

      await UploaderImagesChecker.checkOneFileIsUploaded(body);
    }, JEST_TIMEOUT);

    it('Upload one gif image', async () => {
      const imagePath: string = FileToUploadHelper.getSampleGifPath();
      const body = await UploaderImagesRequestHelper.uploadOneSampleImage(imagePath, userVlad);

      await UploaderImagesChecker.checkOneFileIsUploaded(body);
    }, JEST_TIMEOUT);
  });

  describe('Negative', () => {
    it('Not possible to upload without auth token', async () => {
      const imagePath: string = FileToUploadHelper.getSampleJpgPath();

      await UploaderImagesRequestHelper.uploadOneSampleImage(imagePath, null, 401);
    });

    it('Not possible to upload png file', async () => {
      const imagePath: string = FileToUploadHelper.getSamplePngPath();
      await UploaderImagesRequestHelper.uploadOneSampleImage(imagePath, userVlad, 400);

      const imagePathFake: string = FileToUploadHelper.getSampleFakeGifPath();
      await UploaderImagesRequestHelper.uploadOneSampleImage(imagePathFake, userVlad, 400);

      const imagePathFakeJpg: string = FileToUploadHelper.getSampleFakeJpgPath();
      await UploaderImagesRequestHelper.uploadOneSampleImage(imagePathFakeJpg, userVlad, 400);
    });

    it.skip('Not possible to upload very large jpg file', async () => {
      // is tested manually
    });

    it.skip('Not possible to upload very large gif file', async () => {
      // is tested manually
    });
  });
});

export {};
