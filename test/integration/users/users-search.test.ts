export {};

const request = require('supertest');
const server = require('../../../app');
const requestHelper = require('../helpers/request-helper');
const responseHelper = require('../helpers/response-helper');

const helpers = require('../helpers');

let userVlad;
let userJane;

describe('Users API', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane] = await Promise.all([
      helpers.UserHelper.getUserVlad(),
      helpers.UserHelper.getUserJane(),
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
      .get(requestHelper.getUserSearchUrl('a'))
    ;

    responseHelper.expectStatusOk(res);

    expect(res.body.length).toBe(3);

    const vladResponse = res.body.find(data => data.id === userVlad.id);
    const janeResponse = res.body.find(data => data.id === userJane.id);
    expect(vladResponse).toBeDefined();
    expect(janeResponse).toBeDefined();

    const expectedFields = [
      'account_name', 'first_name', 'last_name', 'nickname', 'avatar_filename',
    ];

    expectedFields.forEach((field) => {
      expect(vladResponse.hasOwnProperty(field)).toBeTruthy();
      expect(janeResponse.hasOwnProperty(field)).toBeTruthy();
    });

    expect(vladResponse.hasOwnProperty('phone_number')).toBeFalsy();
    expect(janeResponse.hasOwnProperty('about')).toBeFalsy();
  });

  it('Get one user by searching shortcut', async () => {
    const res = await request(server)
      .get(requestHelper.getUserSearchUrl('J'))
    ;

    responseHelper.expectStatusOk(res);

    expect(res.body.length).toBe(1);

    const janeResponse = res.body.find(data => data.id === userJane.id);
    expect(janeResponse).toBeDefined();
  });

  it('No users if no search results', async () => {
    const res = await request(server)
      .get(requestHelper.getUserSearchUrl('ZZZ'))
    ;

    responseHelper.expectStatusOk(res);
    expect(res.body.length).toBe(0);
  });
});
