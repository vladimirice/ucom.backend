import UploaderImagesHelper = require('../../../lib/uploader/helper/uploader-images-helper');

const fs = require('fs');

import _ = require('lodash');

const {
  storageFullPath,
} = require('../../../lib/uploader/middleware/upload-one-image-middleware');

class UploaderImagesChecker {
  public static async checkOneFileIsUploaded(body: any) {
    expect(body.files.length).toBe(1);
    expect(Array.isArray(body.files)).toBeTruthy();
    expect(_.isEmpty(body.files)).toBeFalsy();

    const fullName = body.files[0].url;

    expect(fullName).not.toMatch('public/images_uploader');
    expect(fullName).toMatch(UploaderImagesHelper.getDateBasedSubDirectory());

    const filename = body.files[0].url.split('/').pop();

    await this.isFileUploaded(filename);
  }

  public static checkOneFileAbsence(filePath: string): void {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(fs.existsSync(`${storageFullPath}/${filePath}`)).toBeFalsy();
  }

  /**
   *
   * @param {string} filename
   * @return {Promise<void>}
   */
  private static async isFileUploaded(filename) {
    const subDirectory = UploaderImagesHelper.getDateBasedSubDirectory();

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(fs.existsSync(`${storageFullPath}${subDirectory}/${filename}`)).toBeTruthy();
  }
}

export = UploaderImagesChecker;
