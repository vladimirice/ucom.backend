const request = require('supertest');
const server = require('../../../app');
const UserHelper = require('../helpers/users-helper');

const SeedsHelper = require('../helpers/seeds-helper');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const ActivityHelper = require('../helpers/activity-helper');
const PostsService = require('../../../lib/posts/post-service');
const PostsHelper = require('../helpers/posts-helper');

let userVlad;
let userJane;
let userPetr;

describe('Users activity stats', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane, userPetr] = await Promise.all([
      UserHelper.getUserVlad(),
      UserHelper.getUserJane(),
      UserHelper.getUserPetr(),
    ]);
  });

  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  describe('Post-offer activity', () => {
    it('Get info that user joined to post-offer', async () => {
      const post = await PostsService.findLastPostOfferByAuthor(userVlad.id);

      await ActivityHelper.createJoin(userJane, post.id);

      const responsePost = await PostsHelper.getPostByMyself(post.id, userJane);

      expect(responsePost.hasOwnProperty('myselfData')).toBeTruthy();

      expect(responsePost.myselfData.hasOwnProperty('join')).toBeTruthy();
      expect(responsePost.myselfData.join).toBeTruthy();
    });

    it('Get info that user has not joined to post', async () => {
      const post = await PostsService.findLastPostOfferByAuthor(userVlad.id);
      const responsePost = await PostsHelper.getPostByMyself(post.id, userJane);

      expect(responsePost.myselfData.join).toBeFalsy();
    });
  });

  it('List of post does not contain myself statuses', async () => {
    const postToUpvote = await PostsService.findLastMediaPostByAuthor(userJane.id);

    await PostsHelper.requestToUpvotePost(userVlad, postToUpvote.id);

    const res = await request(server)
      .get(RequestHelper.getPostsUrl())
    ;

    ResponseHelper.expectStatusOk(res);

    res.body.data.forEach(post => {
      expect(post.title).toBeDefined();
      expect(post.myselfData).not.toBeDefined();
    });
  });

  it('List of posts must contain post upvote status of myself', async () => {
    const postToUpvote = await PostsService.findLastMediaPostByAuthor(userJane.id);

    await PostsHelper.requestToUpvotePost(userVlad, postToUpvote.id);

    const res = await request(server)
      .get(RequestHelper.getPostsUrl())
      .set('Authorization', `Bearer ${userVlad.token}`)
    ;

    const posts = res.body.data;

    const upvotedPost = posts.find(post => post.id === postToUpvote.id);

    expect(upvotedPost.myselfData).toBeDefined();
    expect(upvotedPost.myselfData.myselfVote).toBeDefined();
    expect(upvotedPost.myselfData.myselfVote).toBe('upvote');

    const notUpvotedPost = posts.find(post => post.id !== postToUpvote.id);

    expect(notUpvotedPost.myselfData.myselfVote).toBe('no_vote');
  });

  it('Get info that user is followed by me', async () => {
    const followed = userJane;

    await ActivityHelper.createFollow(userVlad, userJane);

    const userJaneResponse = await request(server)
      .get(RequestHelper.getUserUrl(followed.id))
      .set('Authorization', `Bearer ${userVlad.token}`)
    ;

    const userJaneBody = userJaneResponse.body;

    expect(userJaneBody.myselfData).toBeDefined();
    expect(userJaneBody.myselfData.follow).toBeTruthy();
  });

  describe('Post author myself activity', () => {
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

    it('Myself data in post User info - following', async () => {
      await ActivityHelper.createFollow(userVlad, userJane);

      const post = await PostsService.findLastMediaPostByAuthor(userJane.id);

      const res = await request(server)
        .get(`${RequestHelper.getPostsUrl()}/${post.id}`)
        .set('Authorization', `Bearer ${userVlad.token}`)
      ;

      ResponseHelper.expectStatusOk(res);

      const body = res.body;

      const author = body['User'];

      expect(author).toBeDefined();

      expect(author['myselfData']).toBeDefined();
      expect(author['myselfData']['follow']).toBeDefined();
      expect(author['myselfData']['follow']).toBeTruthy();

      // TODO myself data upvote - check also
    });
  });

  it('No myself data if no token', async () => {
    const res = await request(server)
      .get(RequestHelper.getUserUrl(userVlad.id))
    ;

    ResponseHelper.expectStatusOk(res);
    expect(res['myselfData']).not.toBeDefined();
  });
});