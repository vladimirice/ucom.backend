const request = require('supertest');
const models = require('../../models');
const usersSeeds = require('../../seeders/users');
const server = require('../../app');
const EosJsEcc = require('../../lib/crypto/eosjs-ecc');
const eosAccounts = require('../../seeders/eos_accounts');
const expect = require('expect');
const AuthHelper = require('./helpers/auth-helper');
const AuthService = require('../../lib/auth/authService');

const eosAccount = eosAccounts[0];
const myselfUrl = '/api/v1/myself';


describe('Myself API', () => {
  beforeEach(async () => {
    await models.Users.destroy({
      where: {},
    });

    await models.Users.bulkCreate(usersSeeds);
  });

  afterAll(async () => {
    await models.sequelize.close();
  });

  it ('Get 401 error to access user editing without token', async () => {
    const res = await request(server)
      .get(myselfUrl)
    ;

    expect(res.status).toBe(401);
  });

  it('Get logged user data', async function ()  {
    const token = AuthService.getNewJwtToken(usersSeeds[0]);

    const res = await request(server)
      .get(myselfUrl)
      .set('Authorization', `Bearer ${token}`)
    ;

    expect(res.status).toBe(200);
    const body = res.body;

    expect(body.hasOwnProperty('account_name'));
    expect(body.account_name).toMatch(usersSeeds[0].account_name);
  });
});
