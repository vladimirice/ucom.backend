export {};

const request = require('supertest');
const server = require('../../../app');
const responseHelper = require('../helpers/response-helper');
const requestHelper = require('../helpers/request-helper');

const seedsHelper = require('../helpers/seeds-helper');

describe('Test registration workflow', () => {

  beforeEach(async () => {
    await seedsHelper.initSeeds();
  });

  afterAll(async () => {
    await seedsHelper.sequelizeAfterAll();
  });

  it('Must return error if invalid account name is provided', async () => {

    const res = await request(server)
      .post(requestHelper.getCheckAccountNameRoute())
      .field('account_name', 'vladInvalid9')
    ;

    responseHelper.expectStatusBadRequest(res);
  });

  it('Must return error if account name is not provided', async () => {

    const res = await request(server)
      .post(requestHelper.getCheckAccountNameRoute())
      .field('wrong_parameter', 'vladInvalid9')
    ;

    responseHelper.expectStatusBadRequest(res);
  });

  it('Must return error if account name is already taken', async () => {
    const res = await request(server)
      .post(requestHelper.getCheckAccountNameRoute())
      .field('account_name', 'vlad')
    ;

    responseHelper.expectStatusBadRequest(res);
  });

  it('Must return OK if account name is valid and free to register', async () => {
    const res = await request(server)
      .post(requestHelper.getCheckAccountNameRoute())
      .field('account_name', 'vlad12312312')
    ;

    responseHelper.expectStatusOk(res);
  });
});
