const request = require('supertest');
const server = require('../../../app');
const UserHelper = require('../helpers/users-helper');

const SeedsHelper = require('../helpers/seeds-helper');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const ActivityUserUserRepository = require('../../../lib/activity/activity-user-user-repository');
const ActivityDictionary = require('../../../lib/activity/activity-types-dictionary');
const BlockchainStatusDictionary = require('../../../lib/eos/eos-blockchain-status-dictionary');

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

    const res = await request(server)
      .post(RequestHelper.getFollowUrl(followed.id))
      .set('Authorization', `Bearer ${userVlad.token}`)
    ;

    ResponseHelper.expectStatusOk(res);

    const userJaneResponse = await request(server)
      .get(RequestHelper.getUserUrl(followed.id))
    ;

    const userJaneBody = userJaneResponse.body;

    expect(userJaneBody['myselfData']).toBeDefined();
    expect(userJaneBody['myselfData']['follow']).toBeTruthy();
  });

  it('No myself data if no token', async () => {
    const res = await request(server)
      .get(RequestHelper.getUserUrl(userVlad.id))
    ;

    ResponseHelper.expectStatusOk(res);
    expect(res['myselfData']).not.toBeDefined();
  });
});