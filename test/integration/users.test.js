const request = require('supertest');
const models = require('../../models');
const usersSeeds = require('../../seeders/users');
const server = require('../../app');

describe('Users API', () => {
  beforeEach(async () => {
    await models.Users.destroy({
      where: {},
    });

    await models.Users.bulkCreate(usersSeeds);
  });

  afterAll(async () => {
    await models.sequelize.close();
  });

  it('GET /users', async () => {
    const userAdmin = usersSeeds[0];

    const res = await request(server)
      .get(`/api/v1/users/${userAdmin.id}`)
    ;

    const body = res.body;

    expect(res.status).toBe(200);

    expect(body.hasOwnProperty('account_address'));
    expect(body.account_name).toBe(userAdmin.account_name);
  });

  it('GET 404 if there is no user with ID', async () => {
    const res = await request(server)
      .get(`/api/v1/users/1000`)
    ;

    expect(res.status).toBe(404);
  });
});
