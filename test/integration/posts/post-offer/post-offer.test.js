const request = require('supertest');
const server = require('../../../../app');
const expect = require('expect');

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
    // TODO - no post_type_id or it is malformed
  });

  it('Not possible to create post without token', async () => {
    const res = await request(server)
        .post(postOfferUrl)
    ;

    ResponseHelper.expectStatusUnauthorized(res);
  });
});
