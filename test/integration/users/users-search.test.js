const request = require('supertest');
const server = require('../../../app');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');

const helpers = require('../helpers');

let userVlad;
let userJane;
let userPetr;

describe('Users API', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane, userPetr] = await Promise.all([
      helpers.UserHelper.getUserVlad(),
      helpers.UserHelper.getUserJane(),
      helpers.UserHelper.getUserPetr(),
    ]);
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  it('GET two users by searching shortcut', async () => {

    const res = await request(server)
      .get(RequestHelper.getUserSearchUrl('a'))
    ;

    ResponseHelper.expectStatusOk(res);

    expect(res.body.length).toBe(3);

    const vladResponse = res.body.find(data => data.id === userVlad.id);
    const janeResponse = res.body.find(data => data.id === userJane.id);
    expect(vladResponse).toBeDefined();
    expect(janeResponse).toBeDefined();

    const expectedFields = [
      'account_name', 'first_name', 'last_name', 'nickname', 'avatar_filename',
    ];

    expectedFields.forEach(field => {
      expect(vladResponse.hasOwnProperty(field)).toBeTruthy();
      expect(janeResponse.hasOwnProperty(field)).toBeTruthy();
    });

    expect(vladResponse.hasOwnProperty('phone_number')).toBeFalsy();
    expect(janeResponse.hasOwnProperty('about')).toBeFalsy();
  });


  it('Get one user by searching shortcut', async () => {
    const res = await request(server)
      .get(RequestHelper.getUserSearchUrl('J'))
    ;

    ResponseHelper.expectStatusOk(res);

    expect(res.body.length).toBe(1);

    const janeResponse = res.body.find(data => data.id === userJane.id);
    expect(janeResponse).toBeDefined();
  });

  it('No users if no search results', async () => {
    const res = await request(server)
      .get(RequestHelper.getUserSearchUrl('ZZZ'))
    ;

    ResponseHelper.expectStatusOk(res);
    expect(res.body.length).toBe(0);
  });
});