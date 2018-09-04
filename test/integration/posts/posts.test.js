const request = require('supertest');
const server = require('../../../app');
const expect = require('expect');

const UsersHelper = require('../helpers/users-helper');
const SeedsHelper = require('../helpers/seeds-helper');
const PostHelper = require('../helpers/posts-helper');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');

const PostsService = require('./../../../lib/posts/post-service');
const FileToUploadHelper = require('../helpers/file-to-upload-helper');
const PostsRepository = require('./../../../lib/posts/posts-repository');
const PostTypeDictionary = require('../../../lib/posts/post-type-dictionary');

const avatarPath = `${__dirname}/../../../seeders/images/ankr_network.png`;

const postsUrl = '/api/v1/posts';


let userVlad;

describe('Posts API', () => {
  beforeAll(async () => {
    userVlad = await UsersHelper.getUserVlad();
  });

  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });


  describe('GET posts', () => {

    it('Get all posts', async () => {

      const res = await request(server)
        .get(postsUrl)
      ;

      expect(res.status).toBe(200);

      const body = res.body;

      const posts = await PostsRepository.findAllPosts();
      expect(body.length).toBe(posts.length);

      expect(body[0].hasOwnProperty('User')).toBeTruthy();
    });

    it('Get one post', async () => {
      const post = await PostsService.findLastMediaPost();

      const res = await request(server)
        .get(`${postsUrl}/${post.id}`)
      ;

      ResponseHelper.expectStatusOk(res);
      PostHelper.validateResponseJson(res.body, post);

      expect(res.body['myselfData']).not.toBeDefined();
    });

    it('Must be 404 response if post id is not correct', async () => {
      const res = await request(server)
        .get(`${postsUrl}/100500`)
      ;

      ResponseHelper.expectStatusNotFound(res);
    });
  });

  it('User data inside post is normalized', async () => {
    await UsersHelper.setSampleRateToUserVlad();

    const post = await PostsService.findLastMediaPostByAuthor(userVlad.id);

    const res = await request(server)
      .get(`${RequestHelper.getPostsUrl()}/${post.id}`)
      .set('Authorization', `Bearer ${userVlad.token}`)
    ;

    ResponseHelper.expectStatusOk(res);
    const body = res.body;

    const author = body['User'];

    expect(author).toBeDefined();
    expect(parseInt(author.current_rate)).toBeGreaterThan(0);
  });
});
