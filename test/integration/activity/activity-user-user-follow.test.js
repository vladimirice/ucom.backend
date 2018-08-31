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

describe('User to user activity', () => {
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

  describe('Positive scenarios', async () => {
    it('Vlad follows Jane', async () => {

      const res = await request(server)
        .post(RequestHelper.getFollowUrl(userJane.id))
        .set('Authorization', `Bearer ${userVlad.token}`)
      ;

      ResponseHelper.expectStatusOk(res);
      const follows = await ActivityUserUserRepository.getFollowActivityForUser(userVlad.id, userJane.id);

      expect(follows).toBeDefined();

      expect(follows.user_id_from).toBe(userVlad.id);
      expect(follows.user_id_to).toBe(userJane.id);
      expect(follows.activity_type_id).toBe(ActivityDictionary.getFollowId());
      expect(parseInt(follows.blockchain_status)).toBe(BlockchainStatusDictionary.getNotRequiredToSend());
    })
  });

  describe('Negative scenarios', async () => {
    it('Not possible to follow without auth token', async () => {
      const res = await request(server)
        .post(RequestHelper.getFollowUrl(userJane.id))
      ;

      ResponseHelper.expectStatusUnauthorized(res);
    });

    it('Not possible to follow twice', async () => {
      const res = await request(server)
        .post(RequestHelper.getFollowUrl(userJane.id))
        .set('Authorization', `Bearer ${userVlad.token}`)
      ;

      ResponseHelper.expectStatusOk(res);

      const resTwice = await request(server)
        .post(RequestHelper.getFollowUrl(userJane.id))
        .set('Authorization', `Bearer ${userVlad.token}`)
      ;

      ResponseHelper.expectStatusBadRequest(resTwice);
    });

    it('Not possible to follow myself', async () => {
      const res = await request(server)
        .post(RequestHelper.getFollowUrl(userVlad.id))
        .set('Authorization', `Bearer ${userVlad.token}`)
      ;

      ResponseHelper.expectStatusBadRequest(res);
    });

    it('Not possible to follow user which does not exist', async () => {
      const res = await request(server)
        .post(RequestHelper.getFollowUrl(100500))
        .set('Authorization', `Bearer ${userVlad.token}`)
      ;

      ResponseHelper.expectStatusNotFound(res);
    });

    it('Not possible to follow user by its invalid ID', async () => {
      const res = await request(server)
        .post(RequestHelper.getFollowUrl('invalidID'))
        .set('Authorization', `Bearer ${userVlad.token}`)
      ;

      ResponseHelper.expectStatusBadRequest(res);
    });
  });
});