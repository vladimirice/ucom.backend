const request = require('supertest');
const server = require('../../../app');
const UserHelper = require('../helpers/users-helper');

const SeedsHelper = require('../helpers/seeds-helper');
const ResponseHelper = require('../helpers/response-helper');
const ActivityUserUserRepository = require('../../../lib/activity/activity-user-user-repository');
const ActivityDictionary = require('../../../lib/activity/activity-types-dictionary');


describe('User to user activity', () => {
  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  describe('Vlad and Jane following activity', () => {
    it('Vlad follows Jane', async () => {
      const userVlad = await UserHelper.getUserVlad();
      const userJane = await UserHelper.getUserJane();

      const res = await request(server)
        .post(`/api/v1/users/${userJane.id}/follow`)
        .set('Authorization', `Bearer ${userVlad.token}`)
      ;

      ResponseHelper.expectStatusOk(res);
      const follows = await ActivityUserUserRepository.getFollowActivityForUser(userVlad.id, userJane.id);

      expect(follows).toBeDefined();

      expect(follows.user_id_from).toBe(userVlad.id);
      expect(follows.user_id_to).toBe(userJane.id);
      expect(follows.activity_type_id).toBe(ActivityDictionary.getFollowId());

      // TODO mock transaction sending in blockchain
    });

    it('Not possible to follow without auth token', async () => {
      const res = await request(server)
        .post('/api/v1/users/1/follow')
      ;

      ResponseHelper.expectStatusUnauthorized(res);
    });
  });
});