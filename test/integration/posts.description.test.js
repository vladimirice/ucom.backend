const request = require('supertest');
const server = require('../../app');
const expect = require('expect');
const fs = require('fs');

const UsersHelper = require('./helpers/users-helper');
const SeedsHelper = require('./helpers/seeds-helper');
const ResponseHelper = require('./helpers/response-helper');


const PostsRepository = require('./../../lib/posts/posts-repository');

const imagePath = `${__dirname}/../../seeders/images/ankr_network.png`;

const postsUrl = '/api/v1/posts';

const { avatarStoragePath } = require('../../lib/users/avatar-upload-middleware');


describe('API to upload post description content', () => {
  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  it('Upload description image', async () => {
    const userVlad = await UsersHelper.getUserVlad();
    const post = await PostsRepository.findAuthorFistPost(userVlad.id);

    const res = await request(server)
      .post(`${postsUrl}/${post.id}/image`)
      .set('Authorization', `Bearer ${userVlad.token}`)
      .attach('image', imagePath)
    ;

    ResponseHelper.expectStatusOk(res);
    const body = res.body;

    expect(fs.existsSync(`${avatarStoragePath}/${body['image_filename']}`)).toBeTruthy();

    const avatarFetchRes = await request(server)
      .get(body['image_url'])
    ;

    ResponseHelper.expectStatusOk(avatarFetchRes);
  });
});