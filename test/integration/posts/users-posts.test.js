const request = require('supertest');
const server = require('../../../app');

const UsersHelper = require('../helpers/users-helper');
const SeedsHelper = require('../helpers/seeds-helper');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const PostRepository = require('./../../../lib/posts/posts-repository');

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

      const res = await request(server)
        .get(RequestHelper.getUserPostsUrl(userVlad.id))
      ;

      ResponseHelper.expectStatusOk(res);

      const body = res.body;

      const userPosts = await PostRepository.findAllByAuthor(userVlad.id);
      expect(userPosts.length).toBe(body.length);

      userPosts.forEach(expectedPost => {
        const actualPost = body.find(post => post.id === expectedPost.id);
        expect(actualPost).toBeDefined();
      });
    });
  });
});