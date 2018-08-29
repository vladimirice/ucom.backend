const request = require('supertest');
const server = require('../../../app');
const ResponseHelper = require('../helpers/response-helper');
const RequestHelper = require('../helpers/request-helper');

const SeedsHelper = require('../helpers/seeds-helper');

describe('Test registration workflow', () => {

  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  it('Must return error if invalid account name is provided', async () => {

    const res = await request(server)
      .post(RequestHelper.getCheckAccountNameRoute())
      .send({
        'account_name': 'vladInvalid9'
      })
    ;

    ResponseHelper.expectStatusBadRequest(res);
  });

  it('Must return error if account name is not provided', async () => {

    const res = await request(server)
      .post(RequestHelper.getCheckAccountNameRoute())
      .send({
        'wrong_parameter': 'vladInvalid9'
      })
    ;

    ResponseHelper.expectStatusBadRequest(res);
  });

  it('Must return error if account name is already taken', async () => {
    const res = await request(server)
      .post(RequestHelper.getCheckAccountNameRoute())
      .send({
        'account_name': 'vlad'
      })
    ;

    ResponseHelper.expectStatusBadRequest(res);
  });

  it('Must return OK if account name is valid and free to register', async () => {
    const res = await request(server)
      .post(RequestHelper.getCheckAccountNameRoute())
      .send({
        'account_name': 'vlad12345123'
      })
    ;

    ResponseHelper.expectStatusOk(res);
  });

});