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
});