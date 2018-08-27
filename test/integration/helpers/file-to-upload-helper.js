const request = require('supertest');
const server = require('../../../app');
const config = require('config');
const fs = require('fs');

const filePath = `${__dirname}/../../../seeders/images/ankr_network.png`;
const { avatarStoragePath } = require('../../../lib/users/avatar-upload-middleware');

const profileFilesUploadDir = config.get('host')['profile_files_upload_dir'];

class FileToUploadHelper {
  static getFilePath() {
    expect(fs.existsSync(filePath)).toBeTruthy();

    return filePath;
  }

  static async isFileUploaded(filename) {
    expect(fs.existsSync(`${avatarStoragePath}/${filename}`)).toBeTruthy();

    const res = await request(server)
      .get(`${profileFilesUploadDir}/${filename}`);

    expect(res.status).toBe(200);
  }
}


module.exports = FileToUploadHelper;