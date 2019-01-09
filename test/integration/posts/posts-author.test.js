const request = require('supertest');
const server = require('../../../app');

const UserHelper = require('../helpers/users-helper');
const SeedsHelper = require('../helpers/seeds-helper');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const PostRepository = require('./../../../lib/posts/posts-repository');
const PostHelper = require('../helpers/posts-helper');
const ActivityHelper = require('../helpers/activity-helper');

let userVlad, userJane;

describe('Posts API', () => {

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

  it('Post author must have correct rating', async () => {
    const expectedRate = await UserHelper.setSampleRateToUser(userVlad);

    const post = await PostRepository.findLastByAuthor(userVlad.id);
    // const postAndMyself = await PostHelper.getPostByMyself(post.id, userVlad);
    const postWithoutMyself = await PostHelper.requestToPost(post.id);

    // expect(postAndMyself['User']['current_rate']).toBe(expectedRate);
    expect(postWithoutMyself['User']['current_rate']).toBe(expectedRate);
  });
});