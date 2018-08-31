const request = require('supertest');
const server = require('../../../app');
const UserHelper = require('../helpers/users-helper');

const SeedsHelper = require('../helpers/seeds-helper');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const ActivityHelper = require('../helpers/activity-helper');
const PostsService = require('../../../lib/posts/post-service');

let userVlad, userJane;

describe('Users activity stats', () => {
  beforeAll(async () => {
    [userVlad, userJane] = await Promise.all([
      UserHelper.getUserVlad(),
      UserHelper.getUserJane()
    ]);
  });

  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  it('Get info that user is followed by me', async () => {
    const followed = userJane;

    await ActivityHelper.createFollow(userVlad, userJane);

    const userJaneResponse = await request(server)
      .get(RequestHelper.getUserUrl(followed.id))
    ;

    const userJaneBody = userJaneResponse.body;

    expect(userJaneBody['myselfData']).toBeDefined();
    expect(userJaneBody['myselfData']['follow']).toBeTruthy();
  });

  it('Myself data in post User info - not following', async () => {
    const post = await PostsService.findLastMediaPostByAuthor(userJane.id);

    const res = await request(server)
      .get(`${RequestHelper.getPostsUrl()}/${post.id}`)
      .set('Authorization', `Bearer ${userVlad.token}`)
    ;

    ResponseHelper.expectStatusOk(res);

    const body = res.body;

    expect(body['User']).toBeDefined();
    expect(body['User']['myselfData']).toBeDefined();
    expect(body['User']['myselfData']['follow']).toBeDefined();
    expect(body['User']['myselfData']['follow']).toBeFalsy();
  });

  it('Myself data in post User info', async () => {
      await ActivityHelper.createFollow(userVlad, userJane);

      const post = await PostsService.findLastMediaPostByAuthor(userJane.id);

      const res = await request(server)
        .get(`${RequestHelper.getPostsUrl()}/${post.id}`)
        .set('Authorization', `Bearer ${userVlad.token}`)
      ;

      ResponseHelper.expectStatusOk(res);

      const body = res.body;

      expect(body['User']).toBeDefined();
      expect(body['User']['myselfData']).toBeDefined();
      expect(body['User']['myselfData']['follow']).toBeDefined();
      expect(body['User']['myselfData']['follow']).toBeTruthy();

      // TODO myself data upvote - check also
  });

  it('No myself data if no token', async () => {
    const res = await request(server)
      .get(RequestHelper.getUserUrl(userVlad.id))
    ;

    ResponseHelper.expectStatusOk(res);
    expect(res['myselfData']).not.toBeDefined();
  });
});