import { JEST_TIMEOUT_LONGER } from '../../../helpers/jest-dictionary';

import SeedsHelper = require('../../helpers/seeds-helper');
import UsersRegistrationHelper = require('../../../helpers/users/users-registration-helper');
import UsersHelper = require('../../helpers/users-helper');
import CommonChecker = require('../../../helpers/common/common-checker');
import AuthHelper = require('../../helpers/auth-helper');
import RequestHelper = require('../../helpers/request-helper');
import EosApi = require('../../../../lib/eos/eosApi');

const { WalletApi, RegistrationApi, SocialKeyApi } = require('ucom-libs-wallet');

beforeAll(async () => {
  await SeedsHelper.noGraphQlNoMocking();
});

afterAll(async () => {
  await SeedsHelper.doAfterAll();
});

beforeEach(async () => {
  await SeedsHelper.beforeAllRoutine();
});

it('Register new user - a transaction with the social key', async () => {
  const { body } = await UsersRegistrationHelper.registerNewUserWithRandomAccountData();

  CommonChecker.expectFieldIsStringDateTime(body.user, 'profile_updated_at');
  await UsersHelper.ensureUserExistByPatch(body.token);

  const state = await WalletApi.getAccountState(body.user.account_name);

  CommonChecker.expectNotEmpty(state);
}, JEST_TIMEOUT_LONGER);

it('should register new user which is created outside - directly in the blockchain', async () => {
  const data = RegistrationApi.generateRandomDataForRegistration({ signBySocial: true });

  await RegistrationApi.createNewAccountInBlockchain(
    EosApi.getCreatorAccountName(),
    EosApi.getCreatorActivePrivateKey(),
    data.accountName,
    data.ownerPublicKey,
    data.activePublicKey,
  );

  await SocialKeyApi.bindSocialKeyWithSocialPermissions(
    data.accountName,
    data.activePrivateKey,
    data.socialPublicKey,
  );

  const fields = {
    account_name:       data.accountName,
    social_public_key:  data.socialPublicKey,
    sign:               data.sign,
  };

  const response = await RequestHelper.makePostGuestRequestWithFields(RequestHelper.getLogInUrl(), fields);

  AuthHelper.validateAuthResponse(response, data.accountName);

  await UsersHelper.ensureUserExistByPatch(response.body.token);
}, JEST_TIMEOUT_LONGER);

export {};
