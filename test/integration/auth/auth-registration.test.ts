import SeedsHelper = require('../helpers/seeds-helper');
import UsersHelper = require('../helpers/users-helper');
import UsersRegistrationHelper = require('../../helpers/users/users-registration-helper');

describe('Test registration workflow', () => {
  beforeAll(async () => {
    await SeedsHelper.noGraphQlNoMocking();
  });

  afterAll(async () => {
    await SeedsHelper.doAfterAll();
  });

  beforeEach(async () => {
    await SeedsHelper.beforeAllRoutine();
  });

  it('Register new user', async () => {
    const { body } = await UsersRegistrationHelper.registerNewUserWithRandomAccountData();

    await UsersHelper.ensureUserExistByPatch(body.token);
  });

  it.skip('given public key must not match existing one', async () => {});
});

export {};
