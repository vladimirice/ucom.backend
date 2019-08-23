import SeedsHelper = require('../../helpers/seeds-helper');
import UsersRegistrationHelper = require('../../../helpers/users/users-registration-helper');
import UsersHelper = require('../../helpers/users-helper');
import CommonChecker = require('../../../helpers/common/common-checker');

const { WalletApi } = require('ucom-libs-wallet');

const JEST_TIMEOUT = 15000;

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

    const state = await WalletApi.getAccountState(body.user.account_name);

    CommonChecker.expectNotEmpty(state);
  }, JEST_TIMEOUT);
});

export {};
