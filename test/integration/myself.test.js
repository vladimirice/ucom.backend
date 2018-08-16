const request = require('supertest');
const models = require('../../models');
const usersSeeds = require('../../seeders/users');
const server = require('../../app');
const EosJsEcc = require('../../lib/crypto/eosjs-ecc');
const eosAccounts = require('../../seeders/eos_accounts');
const expect = require('expect');
const AuthHelper = require('./helpers/auth-helper');

const eosAccount = eosAccounts[0];
const myselfUrl = '/api/v1/myself';


describe('Myself', () => {
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

    // TODO should generate internally, not hardcoded
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiYWNjb3VudF9uYW1lIjoiYWRtaW5fYWNjb3VudF9uYW1lIiwiaWF0IjoxNTM0NDI0OTY4fQ.OBZCv4izTR0K6Mi6Fcjn3WT4N5MieKH5VpesY2WNfeM';
    const account_name = 'admin_account_name';

    const res = await request(server)
      .get(myselfUrl)
      .set('Authorization', `Bearer ${token}`)
    ;

    expect(res.status).toBe(200);
    const body = res.body;

    expect(body.hasOwnProperty('account_name'));
    expect(body.account_name).toMatch(account_name);
  });
});
