const request = require('supertest');
const server = require('../../../app');
const config = require('config');
const UserHelper = require('../helpers/users-helper');

const SeedsHelper = require('../helpers/seeds-helper');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const ActivityUserUserRepository = require('../../../lib/activity/activity-user-user-repository');


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

      // API to eat fact that vlad pressed follow button of Jane account
      // Result - follow is written to database. In test env there are no any blockchain
      // Interactions
      // Step 2 - blockchain interactions based on records
    });

    it('Not possible to follow without auth token', async () => {
      const res = await request(server)
        .post('/api/v1/users/1/follow')
      ;

      ResponseHelper.expectStatusUnauthorized(res);
    });
  });
});