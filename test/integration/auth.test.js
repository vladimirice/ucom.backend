const request = require('supertest');
const models = require('../../models');
const usersSeeds = require('../../seeders/users');
const server = require('../../app');
const EosJsEcc = require('../../lib/crypto/eosjs-ecc');
const eosAccounts = require('../../seeders/eos_accounts');
const expect = require('expect');
const AuthHelper = require('./helpers/auth-helper');

const eosAccount = eosAccounts[0];
const registerUrl = '/api/v1/auth/login';

const vladSeed = usersSeeds[0];
const vladEosAccount = eosAccounts[0];

const janeSeed = usersSeeds[1];
const janeEosAccount = eosAccounts[1];

describe('Test auth workflow', () => {

  beforeEach(async () => {
    await models.Users.destroy({
      truncate: true,
    });
    await models.Users.bulkCreate(usersSeeds);
  });

  afterAll(async () => {
    await models.sequelize.close();
  });

  // TODO registration
  // it('Send correct auth request and receive token and new user', async () => {
  //   const sign = EosJsEcc.sign(eosAccount.account_name, eosAccount.private_key);
  //
  //   const res = await request(server)
  //     .post(registerUrl)
  //     .send({
  //       'account_name': eosAccount.account_name,
  //       'public_key': eosAccount.public_key,
  //       'sign': sign
  //     })
  //   ;
  //
  //   AuthHelper.validateAuthResponse(res, eosAccount.account_name);
  //
  //   const user = await models.Users.findOne({where: {account_name: eosAccount.account_name}});
  //   expect(user).not.toBeNull();
  // });

  it('Send correct auth request but with account which does not exist in blockchain', async () => {
    const account_name = 'testuser';

    const sign = await EosJsEcc.sign(account_name, eosAccount.private_key);

    const res = await request(server)
      .post(registerUrl)
      .send({
        'account_name': account_name,
        'public_key': eosAccount.public_key,
        'sign': sign
      })
    ;

    expect(res.status).toBe(400);
    const body = res.body.errors;
    expect(body.length).toBe(1);

    const publicKeyError = body.find((e) => e.field === 'account_name');
    expect(publicKeyError).toBeDefined();
    expect(publicKeyError.message).toMatch('Such account does not exists in blockchain');
  });

  it('Send correct auth request but with already existed user', async () => {
    const account_name = janeSeed.account_name;
    const private_key = janeEosAccount.private_key;
    const public_key = janeSeed.public_key;

    const usersCountBefore = await models['Users'].count({where: {account_name: account_name}});
    expect(usersCountBefore).toBe(1);

    const sign = EosJsEcc.sign(account_name, private_key);

    const res = await request(server)
      .post(registerUrl)
      .send({
        'account_name': account_name,
        'public_key': public_key,
        'sign': sign
      })
    ;

    AuthHelper.validateAuthResponse(res, account_name);
    const usersCountAfter = await models['Users'].count({where: {account_name: account_name}});
    expect(usersCountAfter).toBe(usersCountBefore);
  }, 10000);


  it('Should receive validation error if no fields provided', async () => {
    const res = await request(server)
      .post(registerUrl)
      .send({
        'account_name': eosAccount.account_name,
      })
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
      .send({
        'account_name': eosAccount.account_name,
        'public_key': eosAccount.public_key,
        'sign': 'invalidSign'
      })
    ;

    expect(res.status).toBe(400);
    const body = res.body;

    expect(body.hasOwnProperty('error')).toBeTruthy();
    expect(body.error).toMatch('Expecting signature like');
  });

  it('Should receive public key error', async () => {
    const res = await request(server)
      .post(registerUrl)
      .send({
        'account_name': eosAccount.account_name,
        'public_key': 'invalid public key',
        'sign': 'invalidSign'
      })
    ;

    expect(res.status).toBe(400);
    const body = res.body;

    expect(body.hasOwnProperty('error')).toBeTruthy();
    expect(body.error).toMatch('Public key is not valid');
  });

  it('Send account name and sign of invalid private key', async () => {
    const account_name = janeSeed.account_name;
    const private_key = vladEosAccount.private_key;
    const public_key = vladSeed.public_key;

    const sign = EosJsEcc.sign(account_name, private_key);

    const res = await request(server)
      .post(registerUrl)
      .send({
        'account_name': account_name,
        'public_key': public_key,
        'sign': sign
      })
    ;

    expect(res.status).toBe(400);
  }, 10000);
});