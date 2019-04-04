const request = require('supertest');
const config = require('config');
const fs = require('fs');
const server = require('../../../app');

const filePath = `${__dirname}/../../../seeders/images/ankr_network.png`;
const jpgFilePath = `${__dirname}/../../../seeders/images/Atonomi-logo.jpg`;
const gifFilePath = `${__dirname}/../../../seeders/images/sample-gif.gif`;
const fakeGifFilePath = `${__dirname}/../../../seeders/images/ankr_network-fake-gif.gif`;
const fakeJpgFilePath = `${__dirname}/../../../seeders/images/ankr_network-fake-jpg.jpg`;
const { avatarStoragePath } = require('../../../lib/users/avatar-upload-middleware');

const profileFilesUploadDir = config.get('host').profile_files_upload_dir;
const organizationsFilesUploadDir = config.get('host').organization_files_upload_dir;

class FileToUploadHelper {
  public static getSampleJpgPath(): string {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(fs.existsSync(jpgFilePath)).toBeTruthy();

    return jpgFilePath;
  }

  public static getSampleFakeGifPath(): string {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(fs.existsSync(fakeGifFilePath)).toBeTruthy();

    return fakeGifFilePath;
  }

  public static getSampleFakeJpgPath(): string {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(fs.existsSync(fakeJpgFilePath)).toBeTruthy();

    return fakeJpgFilePath;
  }

  public static getSampleGifPath(): string {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(fs.existsSync(gifFilePath)).toBeTruthy();

    return gifFilePath;
  }

  public static getSamplePngPath(): string {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(fs.existsSync(filePath)).toBeTruthy();

    return filePath;
  }

  /**
   * @deprecated
   * @see getSamplePngPath
   * @see getSampleJpgPath
   * Get sample file path to test uploading fact
   * @return {string}
   */
  public static getSampleFilePathToUpload(): string {
    return this.getSamplePngPath();
  }

  /**
   *
   * @param {string} filename
   * @param {string} directoryPath
   * @return {Promise<void>}
   */
  public static async isFileUploadedToPath(filename, directoryPath) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(fs.existsSync(`${directoryPath}/${filename}`)).toBeTruthy();

    const res = await request(server)
      .get(`${organizationsFilesUploadDir}/${filename}`);

    // @ts-ignore
    expect(res.status, `There is no such file: ${organizationsFilesUploadDir}/${filename}`)
      .toBe(200);
  }

  /**
   * Is file uploaded
   *
   * @param {string} filename
   * @return {Promise<void>}
   */
  static async isFileUploaded(filename) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(fs.existsSync(`${avatarStoragePath}/${filename}`)).toBeTruthy();

    const res = await request(server)
      .get(`${profileFilesUploadDir}/${filename}`);

    expect(res.status).toBe(200);
  }
}

export = FileToUploadHelper;
