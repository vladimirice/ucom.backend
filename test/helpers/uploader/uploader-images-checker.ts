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
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(fs.existsSync(`${storageFullPath}/${filename}`)).toBeTruthy();
  }
}

export = UploaderImagesChecker;
