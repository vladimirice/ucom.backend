import AuthHelper = require('../helpers/auth-helper');
import UsersHelper = require('../helpers/users-helper');
import SeedsHelper = require('../helpers/seeds-helper');
import ResponseHelper = require('../helpers/response-helper');
import RequestHelper = require('../helpers/request-helper');
import EosJsEcc = require('../../../lib/crypto/eosjs-ecc');

const request = require('supertest');

const server = RequestHelper.getApiApplication();

const eosAccount = UsersHelper.getVladEosAccount();

let userVlad;
let userJane;

let userPetr;

const JEST_TIMEOUT = 10000;

beforeEach(async () => {
  [userVlad, userJane, userPetr] = await SeedsHelper.beforeAllRoutine();
});

afterAll(async () => {
  await SeedsHelper.sequelizeAfterAll();
});

describe('Positive', () => {
  it('Send correct login request with already existed user using social key', async () => {
    const user = userVlad;

    const sign = EosJsEcc.sign(user.account_name, user.social_private_key);

    const fields = {
      account_name: user.account_name,
      social_public_key: user.social_public_key,
      sign,
    };

    const response = await RequestHelper.makePostGuestRequestWithFields(RequestHelper.getLogInUrl(), fields);

    AuthHelper.validateAuthResponse(response, user.account_name);
  }, JEST_TIMEOUT);
});

describe('Negative', () => {
  it('Send correct auth request but with account which does not exist in blockchain', async () => {
    const accountName = 'testuser';

    const sign = await EosJsEcc.sign(accountName, eosAccount.activePk);

    const res = await request(server)
      .post(RequestHelper.getLogInUrl())
      .field('account_name', accountName)
      .field('public_key', eosAccount.activePubKey)
      .field('sign', sign)
    ;

    expect(res.status).toBe(400);
    const body = res.body.errors;
    expect(body.length).toBe(1);

    const publicKeyError = body.find((e) => e.field === 'account_name');
    expect(publicKeyError).toBeDefined();
    expect(publicKeyError.message).toMatch('Incorrect Brainkey or Account name');
  });

  it('Should receive validation error if no fields provided', async () => {
    const res = await request(server)
      .post(RequestHelper.getLogInUrl())
      .field('account_name', eosAccount.account_name)
    ;

    expect(res.status).toBe(400);
    const body = res.body.errors;
    expect(body.length).toBe(1);

    const signError = body.find((e) => e.field === 'sign');
    expect(signError).toBeDefined();
    expect(signError.message).toMatch('Sign is required');
  });


  it('Should receive public key error', async () => {
    const res = await request(server)
      .post(RequestHelper.getLogInUrl())
      .field('account_name', eosAccount.account_name)
      .field('public_key', 'invalid public key')
      .field('sign', 'invalidSign')
    ;

    ResponseHelper.expectStatusBadRequest(res);
    const { body } = res;

    expect(body.hasOwnProperty('errors')).toBeTruthy();
    expect(body.errors[0].message).toMatch('Incorrect Brainkey or Account name or one of the private keys');
  });

  it('should return 401 if token is malformed', async () => {
    // tslint:disable-next-line
    const oldToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNTM3ODc0NzI4fQ.thvAtbCYq8ubbI7mXZgXyQBEmqxZpmbRWuZyCuElaD1';

    const res = await request(server)
      .get(RequestHelper.getUsersUrl())
      .set('Authorization', `Bearer ${oldToken}`)
    ;

    ResponseHelper.expectStatusUnauthorized(res);
  });

  it('Send account name and sign of invalid private key', async () => {
    const sign = EosJsEcc.sign(userPetr.account_name, userJane.private_key);

    const res = await request(server)
      .post(RequestHelper.getLogInUrl())
      .field('account_name', userPetr.account_name)
      .field('public_key', userPetr.public_key)
      .field('sign', sign)
    ;

    expect(res.status).toBe(400);
  }, JEST_TIMEOUT);

  describe('skipped', () => {
    it.skip('Should receive signature error if sign is not valid', async () => {
      const res = await request(server)
        .post(RequestHelper.getLogInUrl())
        .field('account_name', eosAccount.account_name)
        .field('public_key', eosAccount.activePubKey)
        .field('sign', 'invalidSign')
      ;

      ResponseHelper.expectStatusBadRequest(res);
      const { body } = res;

      expect(body.hasOwnProperty('errors')).toBeTruthy();
      expect(body.errors).toMatch('Expecting signature like');
    });
  });
});

describe('Legacy', () => {
  it('Send correct login request with already existed user using active key', async () => {
    const sign = EosJsEcc.sign(userPetr.account_name, userPetr.private_key);

    const response = await request(server)
      .post(RequestHelper.getLogInUrl())
      .field('account_name', userPetr.account_name)
      .field('public_key', userPetr.public_key)
      .field('sign', sign)
    ;

    AuthHelper.validateAuthResponse(response, userPetr.account_name);
  }, JEST_TIMEOUT);
});

export {};
