const request = require('supertest');
const models = require('../../../models');
const server = require('../../../app');
const EosJsEcc = require('../../../lib/crypto/eosjs-ecc');

const AuthHelper = require('../helpers/auth-helper');
const UsersHelper = require('../helpers/users-helper');
const SeedsHelper = require('../helpers/seeds-helper');
const ResponseHelper = require('../helpers/response-helper');

const helpers = require('../helpers');

const eosAccount = UsersHelper.getVladEosAccount();
const registerUrl = '/api/v1/auth/login';

const vladSeed = UsersHelper.getUserVladSeed();
const vladEosAccount = UsersHelper.getVladEosAccount();

const janeSeed = UsersHelper.getUserJaneSeed();
const janeEosAccount = UsersHelper.getJaneEosAccount();

describe('Test auth workflow', () => {

  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  describe('Positive scenarios', () => {
    // TODO put here all positive scenarios
    it('Send correct login request with already existed user', async () => {
      const account_name = janeSeed.account_name;
      const private_key = janeEosAccount.private_key;
      const public_key = janeSeed.public_key;

      const usersCountBefore = await models.Users.count({where: {account_name: account_name}});
      expect(usersCountBefore).toBe(1);

      const sign = EosJsEcc.sign(account_name, private_key);

      const res = await request(server)
        .post(registerUrl)
        .field('account_name', account_name)
        .field('public_key', public_key)
        .field('sign', sign)
      ;

      AuthHelper.validateAuthResponse(res, account_name);
      const usersCountAfter = await models.Users.count({where: {account_name: account_name}});
      expect(usersCountAfter).toBe(usersCountBefore);
    }, 10000);
  });

  it('Send correct auth request but with account which does not exist in blockchain', async () => {
    const account_name = 'testuser';

    const sign = await EosJsEcc.sign(account_name, eosAccount.private_key);

    const res = await request(server)
      .post(registerUrl)
      .field('account_name', account_name)
      .field('public_key', eosAccount.public_key)
      .field('sign', sign)
    ;

    expect(res.status).toBe(400);
    const body = res.body.errors;
    expect(body.length).toBe(1);

    const publicKeyError = body.find((e) => e.field === 'account_name');
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


    const publicKeyError = body.find((e) => e.field === 'public_key');
    expect(publicKeyError).toBeDefined();
    expect(publicKeyError.message).toMatch('Public key is required');

    const signError = body.find((e) => e.field === 'sign');
    expect(signError).toBeDefined();
    expect(signError.message).toMatch('Sign is required');
  });


  it('Should receive signature error if sign is not valid', async () => {
    const res = await request(server)
      .post(registerUrl)
      .field('account_name', eosAccount.account_name)
      .field('public_key', eosAccount.public_key)
      .field('sign', 'invalidSign')
    ;

    ResponseHelper.expectStatusBadRequest(res);
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

    ResponseHelper.expectStatusBadRequest(res);
    const body = res.body;

    expect(body.hasOwnProperty('errors')).toBeTruthy();
    expect(body.errors).toMatch('Public key is not valid');
  });

  it('should return 401 if token is malformed', async () => {
    const oldToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNTM3ODc0NzI4fQ.thvAtbCYq8ubbI7mXZgXyQBEmqxZpmbRWuZyCuElaD1';

    const res = await request(server)
      .get(helpers.RequestHelper.getUsersUrl())
      .set('Authorization', `Bearer ${oldToken}`)
    ;

    ResponseHelper.expectStatusUnauthorized(res);
  });

  it('Send account name and sign of invalid private key', async () => {
    const account_name = janeSeed.account_name;
    const private_key = vladEosAccount.private_key;
    const public_key = vladSeed.public_key;

    const sign = EosJsEcc.sign(account_name, private_key);

    const res = await request(server)
      .post(registerUrl)
      .field('account_name', account_name)
      .field('public_key', public_key)
      .field('sign', sign)
    ;

    expect(res.status).toBe(400);
  }, 10000);
});