import UsersHelper = require('../helpers/users-helper');


import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import RedirectRequest = require('../../helpers/affiliates/redirect-request');
import StreamsCreatorService = require('../../../lib/affiliates/service/streams-creator-service');
import AffiliatesGenerator = require('../../generators/affiliates/affiliates-generator');
import AffiliatesRequest = require('../../helpers/affiliates/affiliates-request');
import ConversionsModel = require('../../../lib/affiliates/models/conversions-model');
import StreamsModel = require('../../../lib/affiliates/models/streams-model');
import ClicksModel = require('../../../lib/affiliates/models/clicks-model');
import ProcessStatusesDictionary = require('../../../lib/common/dictionary/process-statuses-dictionary');
import CommonChecker = require('../../helpers/common/common-checker');
import UsersActivityRepository = require('../../../lib/users/repository/users-activity-repository');

let userVlad: UserModel;
// @ts-ignore
let userJane: UserModel;
let userPetr: UserModel;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

const JEST_TIMEOUT = 5000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 1000;

describe('Affiliates referral registration', () => {
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
    it('Register a referral', async () => {
      const { uniqueId } = await RedirectRequest.makeRedirectRequest(userVlad, offer);

      const click: ClicksModel = ClicksModel.query().findOne({
        user_unique_id: uniqueId,
      });

      const responseBody = await AffiliatesRequest.getRegistrationOfferReferralStatus(uniqueId);

      const affiliatesActions = JSON.stringify([
        {
          offer_id: offer.id,
          account_name_source: responseBody.affiliates_actions[0].account_name_source,
          action: responseBody.affiliates_actions[0].action,
          signed_transaction: 'sample_signed_transaction',
        }
      ]);

      const response = await UsersHelper.registerNewUserWithRandomAccountName({
        affiliates_actions: affiliatesActions,
      }, uniqueId);

      const { user } = response.body;

      const vladStream = StreamsModel.query().findOne({ user_id: userVlad.id });

      const activity = await UsersActivityRepository.findLastByUserId(user.id);
      CommonChecker.expectNotEmpty(activity);
      // TODO check concrete activity fields

      const conversion: ConversionsModel = ConversionsModel.query().findOne({
        offer_id: offer.id,
        user_id: user.id,
        stream_id: vladStream,
        click_id: click.id,
        users_activity_id: activity.id,
        status: ProcessStatusesDictionary.new(),
      });

      CommonChecker.expectNotEmpty(conversion);
      // TODO - purge last message from rabbit mq and check it - should be users-activity
    }, JEST_TIMEOUT);
  });

  describe('Negative', () => {
    it('send uniqueId and malformed affiliates data. A registration must not be broken', async () => {
      // TODO - check logging manually
    });
  });
});

export {};
