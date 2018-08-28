const request = require('supertest');
const server = require('../../../app');

const UsersHelper = require('../helpers/users-helper');
const SeedsHelper = require('../helpers/seeds-helper');
const ResponseHelper = require('../helpers/response-helper');

const PostsService = require('./../../../lib/posts/post-service');

describe('Posts API', () => {
  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  describe('GET posts', () => {

    it('Get all author related posts', async () => {
      const userVlad = await UsersHelper.getUserVlad();

      const url = `/api/v1/users/${userVlad.id}/posts`;

      const res = await request(server)
        .get(url)
      ;

      ResponseHelper.expectStatusOk(res);

      const userPosts = await PostsService.findAllByAuthor(userVlad.id);

      ResponseHelper.compareObjectArrays(userPosts, res.body);
    });
  });
});