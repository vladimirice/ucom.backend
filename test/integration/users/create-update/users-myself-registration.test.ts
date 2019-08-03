import SeedsHelper = require('../../helpers/seeds-helper');
// @ts-ignore
import UsersRegistrationHelper = require('../../../helpers/users/users-registration-helper');
// @ts-ignore
import UsersHelper = require('../../helpers/users-helper');
import CommonChecker = require('../../../helpers/common/common-checker');

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

    CommonChecker.expectFieldIsStringDateTime(body.user, 'profile_updated_at');
    await UsersHelper.ensureUserExistByPatch(body.token);
  }, 15000);
});

export {};
