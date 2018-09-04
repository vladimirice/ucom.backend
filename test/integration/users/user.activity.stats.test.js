const request = require('supertest');
const server = require('../../../app');
const UserHelper = require('../helpers/users-helper');

const SeedsHelper = require('../helpers/seeds-helper');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const ActivityHelper = require('../helpers/activity-helper');
const PostsService = require('../../../lib/posts/post-service');
const PostsHelper = require('../helpers/posts-helper');

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

  it('Get user followers list', async () => {
    // TODO
    // Get user followers list inside user data
    // get followers list inside myself data
  });
});