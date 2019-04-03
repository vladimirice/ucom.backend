import SeedsHelper = require('../helpers/seeds-helper');
import UploaderImagesRequestHelper = require('../../helpers/uploader/uploader-images-request-helper');
// @ts-ignore
import FileToUploadHelper = require('../helpers/file-to-upload-helper');
import _ from 'lodash';
import UploaderImagesChecker = require('../../helpers/uploader/uploader-images-checker');

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

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
    await SeedsHelper.beforeAllRoutine();
  });

  describe('Positive', () => {
    it('upload one image', async () => {
      const body = await UploaderImagesRequestHelper.uploadOneSampleImage();

      await UploaderImagesChecker.checkOneFileIsUploaded(body);
    });
  });
});

export {};
