import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { IResponseBody } from '../../../lib/common/interfaces/request-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import RedirectRequest = require('../../helpers/affiliates/redirect-request');
import AffiliatesRequest = require('../../helpers/affiliates/affiliates-request');
import StreamsModel = require('../../../lib/affiliates/models/streams-model');
import ClicksModel = require('../../../lib/affiliates/models/clicks-model');
import CommonChecker = require('../../helpers/common/common-checker');
import UsersModelProvider = require('../../../lib/users/users-model-provider');
import knex = require('../../../config/knex');
import ActivityGroupDictionary = require('../../../lib/activity/activity-group-dictionary');
import ConversionsModel = require('../../../lib/affiliates/models/conversions-model');
import ProcessStatusesDictionary = require('../../../lib/common/dictionary/process-statuses-dictionary');
import AffiliatesChecker = require('../../helpers/affiliates/affiliates-checker');
import UsersRegistrationHelper = require('../../helpers/users/users-registration-helper');
import AffiliatesBeforeAllHelper = require('../../helpers/affiliates/affiliates-before-all-helper');

const { EventsIds } = require('ucom.libs.common').Events.Dictionary;

let userVlad: UserModel;
let userPetr: UserModel;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'allButSendingToQueue',
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
    [userVlad, , userPetr] = await SeedsHelper.beforeAllRoutine();

    ({ offer } = await AffiliatesBeforeAllHelper.beforeAll(userVlad, userPetr));
  });

  describe('Positive', () => {
    it('Register a referral', async () => {
      const { uniqueId } = await RedirectRequest.makeRedirectRequest(userVlad, offer);

      const click: ClicksModel = await ClicksModel.query().findOne({
        user_unique_id: uniqueId,
      });

      const statusResponseBody: IResponseBody =
        await AffiliatesRequest.getRegistrationOfferReferralStatus(uniqueId);

      const registrationResponse = await UsersRegistrationHelper.registerNewUserWithRandomAccountData();

      const { body } = registrationResponse;
      const { user } = body;

      const transactionResponseBody = await AffiliatesRequest.sendReferralTransaction(
        uniqueId,
        body.token,
        statusResponseBody,
      );

      AffiliatesChecker.checkAffiliatesSuccessReferralRegistration(transactionResponseBody);

      const vladStream = await StreamsModel.query().findOne({ user_id: userVlad.id });

      const activity = await knex(UsersModelProvider.getUsersActivityTableName())
        .where({
          activity_type_id: EventsIds.referral(),
          activity_group_id: ActivityGroupDictionary.getGroupUserUserInteraction(),
          user_id_from: user.id,
          entity_id_to: userVlad.id,
          entity_name: UsersModelProvider.getEntityName(),
          event_id: EventsIds.referral(),
        });

      CommonChecker.expectOnlyOneNotEmptyItem(activity);

      const conversions: ConversionsModel[] = await ConversionsModel.query().where({
        offer_id: offer.id,
        user_id: user.id,
        stream_id: vladStream.id,
        click_id: click.id,
        users_activity_id: activity[0].id,
        status: ProcessStatusesDictionary.new(),
      });

      CommonChecker.expectOnlyOneNotEmptyItem(conversions);
    }, JEST_TIMEOUT);
  });
});

export {};
