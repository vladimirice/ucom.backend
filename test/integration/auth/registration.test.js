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


  // TODO #autotest Public key must not match existing ones bec
  it('Register new user', async () => {

    const userVladData = AccountsData['vlad'];

    const mockAccountName = 'vlad12312312';

    const sign = EosJsEcc.sign(mockAccountName, userVladData.activePk);

    const res = await request(server)
      .post(RequestHelper.getRegistrationRoute())
      .send({
        "account_name": mockAccountName,
        "sign": sign,
        "public_key": userVladData.activePubKey,
        "brainkey" : 'avocate penance cadmium hoick flosh dysuric upplow renegue potoo expirer bookman puja'
      })
    ;

    ResponseHelper.expectStatusOk(res);

    const patchResponse = await request(server)
      .patch('/api/v1/myself')
      .set('Authorization', `Bearer ${res.body.token}`)
      .send({
        'first_name': 12345,
        'birthday': '',
      })
    ;

    expect(patchResponse.status).toBe(200);
  }, 10000);
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
