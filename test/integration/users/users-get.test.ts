export {};

const request = require('supertest');
const server = require('../../../app');

const helpers = require('../helpers');
const userHelper = require('./../helpers/users-helper');
const seedsHelper = require('./../helpers/seeds-helper');
const usersRepository = require('../../../lib/users/users-repository');

require('jest-expect-message');

let userVlad;

describe('Users API', () => {
  beforeAll(async () => { await seedsHelper.destroyTables(); });

  beforeEach(async () => {
    await seedsHelper.initSeedsForUsers();

    // noinspection JSCheckFunctionSignatures
    [userVlad] = await Promise.all([
      userHelper.getUserVlad(),
      userHelper.getUserJane(),
      userHelper.getUserPetr(),
    ]);
  });

  afterAll(async () => { await seedsHelper.sequelizeAfterAll(); });

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

  describe('Sorting and pagination', () => {
    it('Sort by allowed fields - smoke tests', async () => {
      let queryString = helpers.Req.getPaginationQueryString(1, 2);
      queryString += '&sort_by=-current_rate,created_at,-account_name,id';
      queryString += '&v2=true';

      const users = await userHelper.requestUserListAsGuest(queryString);
      helpers.Users.checkManyUsersPreview(users);
    });

    it('Get users with pagination', async () => {
      let queryString = helpers.Req.getPaginationQueryString(1, 2);
      queryString += '&v2=true';

      const users = await userHelper.requestUserListAsGuest(queryString);

      expect(users.length).toBe(2);
      helpers.Users.checkManyUsersPreview(users);

      let queryStringFour = helpers.Req.getPaginationQueryString(1, 5);
      queryStringFour += '&v2=true';

      const usersFour = await userHelper.requestUserListAsGuest(queryStringFour);
      expect(usersFour.length).toBe(4);
      helpers.Users.checkManyUsersPreview(usersFour);

      // No envelope if no param
      const url = helpers.Req.getUsersUrl();

      const usersOld = await request(server)
        .get(url)
      ;

      helpers.Res.expectStatusOk(usersOld);

      expect(usersOld.body.data).not.toBeDefined();
      expect(usersOld.body.metadata).not.toBeDefined();

      helpers.Users.checkManyUsersPreview(usersOld.body);
    });
  });

  it('GET user by ID without auth', async () => {

    const res = await request(server)
      .get(`/api/v1/users/${userVlad.id}`)
    ;

    const body = res.body;

    expect(res.status).toBe(200);

    expect(typeof body).toBe('object');

    const user = await usersRepository.getUserById(userVlad.id);

    const sensitiveFields = usersRepository.getModel().getSensitiveData();

    sensitiveFields.forEach((field) => {
      // @ts-ignore
      expect(body[field], `Field ${field} is defined`).not.toBeDefined();
    });

    userHelper.validateUserJson(body, userVlad, user);
  });

  it('GET 404 if there is no user with ID', async () => {
    const res = await request(server)
      .get('/api/v1/users/1000')
    ;

    expect(res.status).toBe(404);
  });
});
