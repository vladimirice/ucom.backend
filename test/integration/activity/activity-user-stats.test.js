const request = require('supertest');
const server = require('../../../app');
const UserHelper = require('../helpers/users-helper');

const SeedsHelper = require('../helpers/seeds-helper');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const ActivityHelper = require('../helpers/activity-helper');
const PostsService = require('../../../lib/posts/post-service');
const PostsHelper = require('../helpers/posts-helper');

let userVlad, userJane, userPetr, userRokky;

describe('Users activity stats', () => {
  beforeAll(async () => { await SeedsHelper.destroyTables(); });

  beforeEach(async () => {
    await SeedsHelper.initSeedsForUsers();

    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane, userPetr, userRokky] = await Promise.all([
      UserHelper.getUserVlad(),
      UserHelper.getUserJane(),
      UserHelper.getUserPetr(),
      UserHelper.getUserRokky()
    ]);
  });

  afterAll(async () => { await SeedsHelper.sequelizeAfterAll(); });

  describe('Positive scenarios', function () {
    it('User inside I follow must contain normalized current rate', function () {
      // TODO
    });
  });



});