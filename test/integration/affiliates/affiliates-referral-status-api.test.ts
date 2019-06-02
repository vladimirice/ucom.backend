import AffiliateUniqueIdService = require('../../../lib/affiliates/service/affiliate-unique-id-service');

const {  Interactions } = require('ucom-libs-wallet').Dictionary;

const statuses = require('statuses');

import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import RedirectRequest = require('../../helpers/affiliates/redirect-request');
import CommonChecker = require('../../helpers/common/common-checker');
import StreamsCreatorService = require('../../../lib/affiliates/service/streams-creator-service');
import AffiliatesGenerator = require('../../generators/affiliates/affiliates-generator');
import AffiliatesRequest = require('../../helpers/affiliates/affiliates-request');
import AffiliatesChecker = require('../../helpers/affiliates/affiliates-checker');
import { IResponseBody } from '../../../lib/common/interfaces/request-interfaces';

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 1000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 1000;

describe('Affiliates referral status', () => {
  let offer;

  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });

  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane, userPetr] = await SeedsHelper.beforeAllRoutine();

    ({offer} = await AffiliatesGenerator.createPostAndOffer(userVlad));

    await StreamsCreatorService.createRegistrationStreamsForEverybody(offer);

    // Disturbance
    const { uniqueId: firstUniqueId } = await RedirectRequest.makeRedirectRequest(userPetr, offer);
    const { uniqueId: secondUniqueId } = await RedirectRequest.makeRedirectRequest(userPetr, offer);
    await RedirectRequest.makeRedirectRequest(userPetr, offer, firstUniqueId);
    await RedirectRequest.makeRedirectRequest(userPetr, offer, secondUniqueId);
  });

  describe('Positive', () => {
    it('Cookie is valid. Only one click', async () => {
      const { uniqueId } = await RedirectRequest.makeRedirectRequest(userVlad, offer);

      const responseBody = await AffiliatesRequest.getRegistrationOfferReferralStatus(uniqueId);
      AffiliatesChecker.checkAffiliatesActionsResponse(responseBody);
      CommonChecker.expectOnlyOneItem(responseBody.affiliates_actions);

      const expected = {
        offer_id: offer.id,
        account_name_source: userVlad.account_name,
        action: Interactions.referral(),
      };

      expect(responseBody.affiliates_actions[0]).toEqual(expected);

    }, JEST_TIMEOUT);

    it('Attribution model should work properly', async () => {
      const { uniqueId } = await RedirectRequest.makeRedirectRequest(userVlad, offer);
      await RedirectRequest.makeRedirectRequest(userJane, offer, uniqueId);
      // redirect again through the jane flow
      await RedirectRequest.makeRedirectRequest(userJane, offer, uniqueId);

      const responseBody: IResponseBody = await AffiliatesRequest.getRegistrationOfferReferralStatus(uniqueId);
      AffiliatesChecker.expectWinnerIs(responseBody, userVlad);

      // and data is the same - different flow in parallel
      const { uniqueId: secondUniqueId } = await RedirectRequest.makeRedirectRequest(userJane, offer);
      await RedirectRequest.makeRedirectRequest(userVlad, offer, uniqueId);

      const secondResponseBody = await AffiliatesRequest.getRegistrationOfferReferralStatus(secondUniqueId);
      AffiliatesChecker.expectWinnerIs(secondResponseBody, userJane);
    }, JEST_TIMEOUT);


    it('No cookie - no referral info', async () => {
      const responseBody = await AffiliatesRequest.getRegistrationOfferReferralStatus(null, statuses('Unprocessable Entity'));

      CommonChecker.expectEmpty(responseBody);
    }, JEST_TIMEOUT);
  });

  describe('Negative', () => {
    it('make a request with invalid cookie', async () => {
      await AffiliatesRequest.makeRequestForReferralPrograms(
        'malformed token',
        AffiliatesRequest.getEventIdRegistration(),
        statuses('Unauthorized'),
      );
    }, JEST_TIMEOUT);

    it('there is no any offer with provided event_id', async () => {
      const { uniqueId } = await RedirectRequest.makeRedirectRequest(userVlad, offer);

      const jwtToken = AffiliateUniqueIdService.generateJwtTokenWithUniqueId(uniqueId);

      await AffiliatesRequest.makeRequestForReferralPrograms(
        jwtToken,
        100500,
        statuses('Bad Request'),
      )
    }, JEST_TIMEOUT);
  });
});

export {};
