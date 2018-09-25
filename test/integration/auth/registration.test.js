const request = require('supertest');
const server = require('../../../app');
const ResponseHelper = require('../helpers/response-helper');
const RequestHelper = require('../helpers/request-helper');
const EosJsEcc = require('eosjs-ecc');
const AccountsData = require('../../../config/accounts-data');

const SeedsHelper = require('../helpers/seeds-helper');

describe('Test registration workflow', () => {

  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  // TODO #autotest Public key must not match existing one
  it('Register new user', async () => {

    const userVladData = AccountsData.karolinaer;

    const mockAccountName = 'vlad12312312';

    const sign = EosJsEcc.sign(mockAccountName, userVladData.activePk);

    const res = await request(server)
      .post(RequestHelper.getRegistrationRoute())
      .field("account_name", mockAccountName)
      .field("sign", sign)
      .field("public_key", userVladData.activePubKey)
      .field("brainkey", 'avocate penance cadmium hoick flosh dysuric upplow renegue potoo expirer bookman puja')
    ;

    ResponseHelper.expectStatusOk(res);

    const patchResponse = await request(server)
      .patch('/api/v1/myself')
      .set('Authorization', `Bearer ${res.body.token}`)
      .field('first_name', 12345)
      .field('birthday', '')
    ;

    expect(patchResponse.status).toBe(200);
  }, 10000);
});
