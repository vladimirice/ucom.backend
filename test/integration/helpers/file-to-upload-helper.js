const request = require('supertest');
const server = require('../../../app');
const config = require('config');
const fs = require('fs');

const filePath = `${__dirname}/../../../seeders/images/ankr_network.png`;
const { avatarStoragePath } = require('../../../lib/users/avatar-upload-middleware');

const profileFilesUploadDir = config.get('host')['profile_files_upload_dir'];
const organizationsFilesUploadDir = config.get('host')['organization_files_upload_dir'];

class FileToUploadHelper {

  /**
   * @deprecated - name is changed
   * @see getSampleFilePathToUpload
   * Get sample file path to test uploading fact
   * @return {string}
   */
  static getFilePath() {
    return this.getSampleFilePathToUpload();
  }

  /**
   * Get sample file path to test uploading fact
   * @return {string}
   */
  static getSampleFilePathToUpload() {
    expect(fs.existsSync(filePath)).toBeTruthy();

    return filePath;
  }
  /**
   *
   * @param {string} filename
   * @param {string} directoryPath
   * @return {Promise<void>}
   */
  static async isFileUploadedToPath(filename, directoryPath) {
    expect(fs.existsSync(`${directoryPath}/${filename}`)).toBeTruthy();

    const res = await request(server)
      .get(`${organizationsFilesUploadDir}/${filename}`);

    expect(res.status, `There is no such file: ${organizationsFilesUploadDir}/${filename}`).toBe(200);
  }

  /**
   * Is file uploaded
   *
   * @param {string} filename
   * @return {Promise<void>}
   */
  static async isFileUploaded(filename) {
    expect(fs.existsSync(`${avatarStoragePath}/${filename}`)).toBeTruthy();

    const res = await request(server)
      .get(`${profileFilesUploadDir}/${filename}`);

    expect(res.status).toBe(200);
  }
}


module.exports = FileToUploadHelper;