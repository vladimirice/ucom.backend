const request = require('supertest');
const server = require('../../app');
const UsersHelper = require('./helpers/users-helper');
const SeedsHelper = require('./helpers/seeds-helper');
const UsersRepository = require('../../lib/users/users-repository');

const userVlad = UsersHelper.getUserVladSeed();

describe('Users API', () => {
  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  it('GET user by ID without auth', async () => {

    const res = await request(server)
      .get(`/api/v1/users/${userVlad.id}`)
    ;

    const body = res.body;

    expect(res.status).toBe(200);

    expect(typeof body).toBe('object');

    const user = await UsersRepository.getUserById(userVlad.id);

    UsersHelper.validateUserJson(body, userVlad, user);
  });

  it('GET 404 if there is no user with ID', async () => {
    const res = await request(server)
      .get(`/api/v1/users/1000`)
    ;

    expect(res.status).toBe(404);
  });
});
