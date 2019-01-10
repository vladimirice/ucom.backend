const request = require('supertest');
const server = require('../../../app');
const helpers = require('../helpers');

describe('Test registration workflow', () => {

  beforeEach(async () => {
    await helpers.Seeds.initSeeds();
  });

  afterAll(async () => {
    await helpers.Seeds.sequelizeAfterAll();
  });

  it('Register new user', async () => {
    const { body } = await helpers.Users.registerNewUser();

    const patchResponse = await request(server)
      .patch('/api/v1/myself')
      .set('Authorization', `Bearer ${body.token}`)
      .field('first_name', 12345)
      .field('birthday', '')
    ;

    expect(patchResponse.status).toBe(200);
  }, 10000);

  it.skip('given public key must not match existing one', async () => {

  });
});
