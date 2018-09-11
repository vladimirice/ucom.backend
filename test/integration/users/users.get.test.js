const request = require('supertest');
const server = require('../../../app');
const UserHelper = require('./../helpers/users-helper');
const SeedsHelper = require('./../helpers/seeds-helper');
const UsersRepository = require('../../../lib/users/users-repository');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');

require('jest-expect-message');

let userVlad, userJane, userPetr;

describe('Users API', () => {
  beforeAll(async () => { await SeedsHelper.destroyTables(); });
  afterAll(async () => { await SeedsHelper.sequelizeAfterAll(); });

  beforeEach(async () => {
    await SeedsHelper.initSeedsForUsers();

    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane, userPetr] = await Promise.all([
      UserHelper.getUserVlad(),
      UserHelper.getUserJane(),
      UserHelper.getUserPetr()
    ]);
  });


  describe('should provide correct pagination', () => {
    // TODO
  });




});