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
let userJane: UserModel;
let userPetr: UserModel;
let userRokky: UserModel;

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
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Positive', () => {
    it('upload a lot of files at once but by different users', async () => {
      // #task - before all - clear uploader directory
      const jpgPath: string = FileToUploadHelper.getSampleJpgPath();
      const gifPath: string = FileToUploadHelper.getSampleGifPath();

      await Promise.all([
        UploaderImagesRequestHelper.uploadOneSampleImage(jpgPath, userVlad),
        UploaderImagesRequestHelper.uploadOneSampleImage(gifPath, userJane),
        UploaderImagesRequestHelper.uploadOneSampleImage(jpgPath, userPetr),
        UploaderImagesRequestHelper.uploadOneSampleImage(gifPath, userRokky),
      ]);
      // and once again...
      await Promise.all([
        UploaderImagesRequestHelper.uploadOneSampleImage(jpgPath, userVlad),
        UploaderImagesRequestHelper.uploadOneSampleImage(gifPath, userJane),
        UploaderImagesRequestHelper.uploadOneSampleImage(jpgPath, userPetr),
        UploaderImagesRequestHelper.uploadOneSampleImage(gifPath, userRokky),
      ]);

      // #task - count files inside dir
    });

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
    it('If no file then properly error is occurred', async () => {
      await UploaderImagesRequestHelper.uploadOneSampleImage(null, userVlad, 400);
    }, JEST_TIMEOUT_DEBUG);

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
