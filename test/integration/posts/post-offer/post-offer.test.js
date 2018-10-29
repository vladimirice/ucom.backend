const request = require('supertest');
const server = require('../../../../app');
const expect = require('expect');

const helpers = require('../../helpers');

const UserHelper = require('../../helpers/users-helper');
const SeedsHelper = require('../../helpers/seeds-helper');
const RequestHelper = require('../../helpers/request-helper');
const ResponseHelper = require('../../helpers/response-helper');

const PostsService = require('./../../../../lib/posts/post-service');

const postOfferUrl = '/api/v1/posts';

let userVlad, userJane;

describe('Posts API', () => {
  beforeAll(async () => {
    [userVlad, userJane] = await Promise.all([
      UserHelper.getUserVlad(),
      UserHelper.getUserJane()
    ]);
  });

  beforeEach(async () => {
    await SeedsHelper.initPostOfferSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  describe('Post-offer activity', () => {
    it.skip('Get info that user joined to post-offer', async () => {
      const post = await PostsService.findLastPostOfferByAuthor(userVlad.id);

      await helpers.ActivityHelper.createJoin(userJane, post.id);

      const responsePost = await helpers.PostHelper.getPostByMyself(post.id, userJane);

      expect(responsePost.hasOwnProperty('myselfData')).toBeTruthy();

      expect(responsePost.myselfData.hasOwnProperty('join')).toBeTruthy();
      expect(responsePost.myselfData.join).toBeTruthy();
    });

    it('Get info that user has not joined to post', async () => {
      const post = await PostsService.findLastPostOfferByAuthor(userVlad.id);
      const responsePost = await helpers.PostHelper.getPostByMyself(post.id, userJane);

      expect(responsePost.myselfData.join).toBeFalsy();
    });
  });

  it('Get one post', async () => {
    const post = await PostsService.findLastPostOffer(userVlad.id);

    const res = await request(server)
      .get(RequestHelper.getOnePostUrl(post.id))
    ;

    ResponseHelper.expectStatusOk(res);

    const body = res.body;

    expect(body['action_button_title']).toBeDefined();
    expect(body['post_offer']).not.toBeDefined();

    expect(body['post_users_team']).toBeDefined();

    body['post_users_team'].forEach(data => {
      expect(data['account_name']).toBeDefined();
    });

    // TODO
    // PostHelper.validateResponseJson(res.body, post);
  });

  describe('Negative scenarios', function () {
    it('no post_type_id or it is malformed', async () => {
      // TODO
    });
  });

  it('Not possible to create post without token', async () => {
    const res = await request(server)
        .post(postOfferUrl)
    ;

    ResponseHelper.expectStatusUnauthorized(res);
  });
});
