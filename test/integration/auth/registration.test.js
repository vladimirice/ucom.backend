const request = require('supertest');
const server = require('../../../app');
const ResponseHelper = require('../helpers/response-helper');
const RequestHelper = require('../helpers/request-helper');
const UsersHelper = require('../helpers/users-helper');
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


  // Public key must not match existing ones

  it('Register new user', async () => {

    const userVlad = await UsersHelper.getUserVlad();
    const userVladData = AccountsData['vlad'];

    const mockAccountName = 'vlad12345123';

    const sign = EosJsEcc.sign(mockAccountName, userVladData.activePk);

    const res = await request(server)
      .post(RequestHelper.getRegistrationRoute())
      .send({
        "account_name": mockAccountName,
        "sign": sign,
        "public_key": userVladData.activePubKey,
        "brainkey" : "brainkey"
      })
    ;

    ResponseHelper.expectStatusOk(res);

    const authRes = await request(server)
      .get('/api/v1/myself')
      .set('Authorization', `Bearer ${res.body.token}`)
    ;

    ResponseHelper.expectStatusOk(authRes);
  });
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
