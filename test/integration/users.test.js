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

  it ('Get 401 error to access user editing without token', async () => {
    const res = await request(server)
      .post(`/api/v1/users/sample`)
    ;

    expect(res.status).toBe(401);
  });

  it('Edit user data if token is provided', async function ()  {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiYWNjb3VudF9uYW1lIjoiYWRtaW5fYWNjb3VudF9uYW1lIiwiaWF0IjoxNTM0NDI0OTY4fQ.OBZCv4izTR0K6Mi6Fcjn3WT4N5MieKH5VpesY2WNfeM';

    const res = await request(server)
      .post(`/api/v1/users/sample`)
      .set('Authorization', `Bearer ${token}`)
    ;
  });

});
