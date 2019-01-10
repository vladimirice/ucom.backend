export {};

const request = require('supertest');
const models = require('../../../models');
const server = require('../../../app');
const eosJsEcc = require('../../../lib/crypto/eosjs-ecc');

const authHelper = require('../helpers/auth-helper');
const usersHelper = require('../helpers/users-helper');
const seedsHelper = require('../helpers/seeds-helper');
const responseHelper = require('../helpers/response-helper');

const helpers = require('../helpers');

const eosAccount = usersHelper.getVladEosAccount();
const registerUrl = '/api/v1/auth/login';

const vladSeed = usersHelper.getUserVladSeed();
const vladEosAccount = usersHelper.getVladEosAccount();

const janeSeed = usersHelper.getUserJaneSeed();
const janeEosAccount = usersHelper.getJaneEosAccount();

describe('Test auth workflow', () => {

  beforeEach(async () => {
    await seedsHelper.initSeeds();
  });

  afterAll(async () => {
    await seedsHelper.sequelizeAfterAll();
  });

  describe('Positive scenarios', () => {
    // #task put here all positive scenarios
    it('Send correct login request with already existed user', async () => {
      const account_name = janeSeed.account_name;
      const privateKey = janeEosAccount.activePk;
      const public_key = janeSeed.public_key;

      const usersCountBefore = await models.Users.count({ where: { account_name } });
      expect(usersCountBefore).toBe(1);

      const sign = eosJsEcc.sign(account_name, privateKey);

      const res = await request(server)
        .post(registerUrl)
        .field('account_name', account_name)
        .field('public_key', public_key)
        .field('sign', sign)
      ;

      authHelper.validateAuthResponse(res, account_name);
      const usersCountAfter = await models.Users.count({ where: { account_name } });
      expect(usersCountAfter).toBe(usersCountBefore);
    }, 10000);
  });

  it('Send correct auth request but with account which does not exist in blockchain', async () => {
    const accountName = 'testuser';

    const sign = await eosJsEcc.sign(accountName, eosAccount.activePk);

    const res = await request(server)
      .post(registerUrl)
      .field('account_name', accountName)
      .field('public_key', eosAccount.activePubKey)
      .field('sign', sign)
    ;

    expect(res.status).toBe(400);
    const body = res.body.errors;
    expect(body.length).toBe(1);

    const publicKeyError = body.find(e => e.field === 'account_name');
    expect(publicKeyError).toBeDefined();
    expect(publicKeyError.message).toMatch('Such account does not exist in blockchain');
  });

  it('Should receive validation error if no fields provided', async () => {
    const res = await request(server)
      .post(registerUrl)
      .field('account_name', eosAccount.account_name)
    ;

    expect(res.status).toBe(400);
    const body = res.body.errors;
    expect(body.length).toBe(2);

    const publicKeyError = body.find(e => e.field === 'public_key');
    expect(publicKeyError).toBeDefined();
    expect(publicKeyError.message).toMatch('Public key is required');

    const signError = body.find(e => e.field === 'sign');
    expect(signError).toBeDefined();
    expect(signError.message).toMatch('Sign is required');
  });

  it('Should receive signature error if sign is not valid', async () => {
    const res = await request(server)
      .post(registerUrl)
      .field('account_name', eosAccount.account_name)
      .field('public_key', eosAccount.activePubKey)
      .field('sign', 'invalidSign')
    ;

    responseHelper.expectStatusBadRequest(res);
    const body = res.body;

    expect(body.hasOwnProperty('errors')).toBeTruthy();
    expect(body.errors).toMatch('Expecting signature like');
  });

  it('Should receive public key error', async () => {
    const res = await request(server)
      .post(registerUrl)
      .field('account_name', eosAccount.account_name)
      .field('public_key', 'invalid public key')
      .field('sign', 'invalidSign')
    ;

    responseHelper.expectStatusBadRequest(res);
    const body = res.body;

    expect(body.hasOwnProperty('errors')).toBeTruthy();
    expect(body.errors).toMatch('Public key is not valid');
  });

  it('should return 401 if token is malformed', async () => {
    // tslint:disable-next-line
    const oldToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNTM3ODc0NzI4fQ.thvAtbCYq8ubbI7mXZgXyQBEmqxZpmbRWuZyCuElaD1';

    const res = await request(server)
      .get(helpers.RequestHelper.getUsersUrl())
      .set('Authorization', `Bearer ${oldToken}`)
    ;

    responseHelper.expectStatusUnauthorized(res);
  });

  it('Send account name and sign of invalid private key', async () => {
    const account_name = janeSeed.account_name;
    const privateKey = vladEosAccount.activePk;
    const public_key = vladSeed.public_key;

    const sign = eosJsEcc.sign(account_name, privateKey);

    const res = await request(server)
      .post(registerUrl)
      .field('account_name', account_name)
      .field('public_key', public_key)
      .field('sign', sign)
    ;

    expect(res.status).toBe(400);
  }, 10000);
});
