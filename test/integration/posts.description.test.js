const request = require('supertest');
const server = require('../../app');
const config = require('config');

const rootUrl = config.get('host')['root_url'];
const SeedsHelper = require('./helpers/seeds-helper');
const ResponseHelper = require('./helpers/response-helper');
const imagePath = `${__dirname}/../../seeders/images/ankr_network.png`;

const postsUrl = '/api/v1/posts';

describe('API to upload post description content', () => {
  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  it('Upload description image', async () => {
    const res = await request(server)
      .post(`${postsUrl}/image`)
      // .set('Authorization', `Bearer ${userVlad.token}`) // TODO #feature
      .attach('image', imagePath)
    ;

    ResponseHelper.expectStatusOk(res);
    const fileUrl = res.body.files[0].url.replace(rootUrl, '');

    const avatarFetchRes = await request(server)
      .get(fileUrl)
    ;

    ResponseHelper.expectStatusOk(avatarFetchRes);
  });
});