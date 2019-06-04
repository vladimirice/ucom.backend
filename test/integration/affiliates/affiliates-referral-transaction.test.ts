import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import AffiliatesResponse = require('../../helpers/affiliates/affiliates-response');

const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const { SocialApi }  = require('ucom-libs-wallet');
const { Interactions } = require('ucom-libs-wallet').Dictionary;

import SeedsHelper = require('../helpers/seeds-helper');
import RedirectRequest = require('../../helpers/affiliates/redirect-request');
import StreamsCreatorService = require('../../../lib/affiliates/service/streams-creator-service');
import AffiliatesGenerator = require('../../generators/affiliates/affiliates-generator');
import AffiliatesRequest = require('../../helpers/affiliates/affiliates-request');
import UsersActivityCommonHelper = require('../../helpers/users/activity/users-activity-common-helper');
import TransactionsPushResponseChecker = require('../../helpers/common/transactions-push-response-checker');
import UsersRegistrationHelper = require('../../helpers/users/users-registration-helper');
import EosApi = require('../../../lib/eos/eosApi');

let userVlad: UserModel;
let userPetr: UserModel;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'none',
};

EosApi.initBlockchainLibraries();

const JEST_TIMEOUT = 5000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 1000;

describe('Affiliates referral transaction', () => {
  let offer;

  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });

  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, , userPetr] = await SeedsHelper.beforeAllRoutine();

    ({ offer } = await AffiliatesGenerator.createPostAndOffer(userVlad));

    await StreamsCreatorService.createRegistrationStreamsForEverybody(offer);

    // Disturbance
    const { uniqueId: firstUniqueId } = await RedirectRequest.makeRedirectRequest(userPetr, offer);
    const { uniqueId: secondUniqueId } = await RedirectRequest.makeRedirectRequest(userPetr, offer);
    await RedirectRequest.makeRedirectRequest(userPetr, offer, firstUniqueId);
    await RedirectRequest.makeRedirectRequest(userPetr, offer, secondUniqueId);
  });

  describe('Positive', () => {
    it('Register a referral with the transaction', async () => {
      const { uniqueId }        = await RedirectRequest.makeRedirectRequest(userVlad, offer);
      const statusResponseBody  = await AffiliatesRequest.getRegistrationOfferReferralStatus(uniqueId);

      const response = await UsersRegistrationHelper.registerNewUserWithRandomAccountData();

      const { user: userReferral } = response.body;

      const signedTransaction: string = await SocialApi.getReferralFromUserSignedTransactionAsJson(
        response.accountData.accountName,
        response.accountData.privateActiveKey,
        AffiliatesResponse.getAccountNameSourceFromResponse(statusResponseBody),
      );

      await AffiliatesRequest.sendReferralTransaction(
        uniqueId,
        response.body.token,
        statusResponseBody,
        signedTransaction,
      );

      const { blockchainResponse } =
        await UsersActivityCommonHelper.getProcessedActivity(userReferral.id, EventsIds.referral());

      const expected = UsersActivityCommonHelper.getOneUserSocialPushResponse(
        <string>userReferral.account_name,
        <string>userVlad.account_name,
        Interactions.referral(),
      );

      TransactionsPushResponseChecker.checkOneTransaction(blockchainResponse, expected);
    }, JEST_TIMEOUT_DEBUG);
  });
});

export {};
