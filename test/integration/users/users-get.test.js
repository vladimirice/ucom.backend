const request = require('supertest');
const server = require('../../../app');

const helpers = require('../helpers');
const UserHelper = require('./../helpers/users-helper');
const SeedsHelper = require('./../helpers/seeds-helper');
const UsersRepository = require('../../../lib/users/users-repository');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');

require('jest-expect-message');

let userVlad, userJane, userPetr;

describe('Users API', () => {
  beforeAll(async () => { await SeedsHelper.destroyTables(); });

  beforeEach(async () => {
    await SeedsHelper.initSeedsForUsers();

    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane, userPetr] = await Promise.all([
      UserHelper.getUserVlad(),
      UserHelper.getUserJane(),
      UserHelper.getUserPetr()
    ]);
  });

  afterAll(async () => { await SeedsHelper.sequelizeAfterAll(); });

  it('Get myself', async () => {
    const res = await request(server)
      .get(helpers.Req.getMyselfUrl())
      .set('Authorization', `Bearer ${userVlad.token}`)
    ;

    helpers.Res.expectStatusOk(res);

    const body = res.body;

    expect(body.is_tracking_allowed).toBeDefined();
    expect(body.is_tracking_allowed).toBeFalsy();
  });

  it('GET all users', async () => {
    const res = await request(server)
      .get(RequestHelper.getUsersUrl())
    ;

    ResponseHelper.expectStatusOk(res);

    const sensitiveData = UsersRepository.getModel().getSensitiveData();

    res.body.forEach(user => {
      sensitiveData.forEach(field => {
        expect(user[field], `Field ${field} is defined`).not.toBeDefined();
      })
    });

  });

  it('GET user by ID without auth', async () => {

    const res = await request(server)
      .get(`/api/v1/users/${userVlad.id}`)
    ;

    const body = res.body;

    expect(res.status).toBe(200);

    expect(typeof body).toBe('object');

    const user = await UsersRepository.getUserById(userVlad.id);

    const sensitiveFields = UsersRepository.getModel().getSensitiveData();

    sensitiveFields.forEach(field => {
      expect(body[field], `Field ${field} is defined`).not.toBeDefined();
    });

    UserHelper.validateUserJson(body, userVlad, user);
  });

  it('GET 404 if there is no user with ID', async () => {
    const res = await request(server)
      .get(`/api/v1/users/1000`)
    ;

    expect(res.status).toBe(404);
  });
});
