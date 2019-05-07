import RequestHelper = require('../../helpers/request-helper');

export {};

const request = require('supertest');
const server = RequestHelper.getApiApplication();
const expect = require('expect');

const helpers = require('../../helpers');

const userHelper = require('../../helpers/users-helper');
const seedsHelper = require('../../helpers/seeds-helper');
const requestHelper = require('../../helpers/request-helper');
const responseHelper = require('../../helpers/response-helper');

const postsService = require('./../../../../lib/posts/post-service');

const postOfferUrl = '/api/v1/posts';

let userVlad;
let userJane;

describe('Posts API', () => {
  beforeAll(async () => {
    [userVlad, userJane] = await Promise.all([
      userHelper.getUserVlad(),
      userHelper.getUserJane(),
    ]);
  });

  beforeEach(async () => {
    await seedsHelper.initPostOfferSeeds();
  });

  afterAll(async () => {
    await seedsHelper.sequelizeAfterAll();
  });

  describe('Post-offer activity', () => {
    it.skip('Get info that user joined to post-offer', async () => {
      const post = await postsService.findLastPostOfferByAuthor(userVlad.id);

      await helpers.ActivityHelper.createJoin(userJane, post.id);

      const responsePost = await helpers.PostHelper.getPostByMyself(post.id, userJane);

      expect(responsePost.hasOwnProperty('myselfData')).toBeTruthy();

      expect(responsePost.myselfData.hasOwnProperty('join')).toBeTruthy();
      expect(responsePost.myselfData.join).toBeTruthy();
    });

    it('Get info that user has not joined to post', async () => {
      const post = await postsService.findLastPostOfferByAuthor(userVlad.id);
      const responsePost = await helpers.PostHelper.getPostByMyself(post.id, userJane);

      expect(responsePost.myselfData.join).toBeFalsy();
    });
  });

  it('Get one post', async () => {
    const post = await postsService.findLastPostOffer(userVlad.id);

    const res = await request(server)
      .get(requestHelper.getOnePostUrl(post.id))
    ;

    responseHelper.expectStatusOk(res);

    const body = res.body;

    expect(body['action_button_title']).toBeDefined();
    expect(body['post_offer']).not.toBeDefined();

    expect(body['post_users_team']).toBeDefined();

    body['post_users_team'].forEach((data) => {
      expect(data['account_name']).toBeDefined();
    });

    // #task
    // PostHelper.validateResponseJson(res.body, post);
  });

  describe('Negative scenarios', () => {
    it.skip('no post_type_id or it is malformed', async () => {
    });
  });

  it('Not possible to create post without token', async () => {
    const res = await request(server)
        .post(postOfferUrl)
    ;

    responseHelper.expectStatusUnauthorized(res);
  });
});
