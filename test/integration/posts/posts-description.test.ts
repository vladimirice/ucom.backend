export {};

const request = require('supertest');
const server = require('../../../app');
const expect = require('expect');
const fs = require('fs');
const config = require('config');

const seedsHelper = require('../helpers/seeds-helper');
const responseHelper = require('../helpers/response-helper');

const imagePath = `${__dirname}/../../../seeders/images/ankr_network.png`;

const postsUrl = '/api/v1/posts';

const { avatarStoragePath } = require('../../../lib/users/avatar-upload-middleware');

describe('API to upload post description content', () => {
  beforeEach(async () => {
    await seedsHelper.initSeeds();
  });

  afterAll(async () => {
    await seedsHelper.sequelizeAfterAll();
  });

  it('Upload description image', async () => {

    const res = await request(server)
      .post(`${postsUrl}/image`)
      .attach('image', imagePath)
    ;

    responseHelper.expectStatusOk(res);
    const body = res.body;
    const fileUrl = body['files'][0]['url'];

    const filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);

    expect(fs.existsSync(`${avatarStoragePath}/${filename}`)).toBeTruthy();

    const rootUrl = config.get('host')['root_url'];

    const avatarFetchRes = await request(server)
      .get(fileUrl.replace(rootUrl, ''))
    ;

    responseHelper.expectStatusOk(avatarFetchRes);
  });
});
