import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { IResponseBody } from '../../../lib/common/interfaces/request-interfaces';

import UsersActivityCommonHelper = require('../../helpers/users/activity/users-activity-common-helper');

// const { EventsIds } = require('ucom.libs.common').Events.Dictionary;

import SeedsHelper = require('../helpers/seeds-helper');
import RedirectRequest = require('../../helpers/affiliates/redirect-request');
import StreamsCreatorService = require('../../../lib/affiliates/service/streams-creator-service');
import AffiliatesGenerator = require('../../generators/affiliates/affiliates-generator');
import AffiliatesRequest = require('../../helpers/affiliates/affiliates-request');
import EosApi = require('../../../lib/eos/eosApi');
import RegistrationConversionProcessor = require('../../../lib/affiliates/service/conversions/registration-conversion-processor');
import ConversionsModel = require('../../../lib/affiliates/models/conversions-model');
import ProcessStatusesDictionary = require('../../../lib/common/dictionary/process-statuses-dictionary');
import UsersModelProvider = require('../../../lib/users/users-model-provider');
import knex = require('../../../config/knex');
import UsersActivityReferralRepository = require('../../../lib/affiliates/repository/users-activity-referral-repository');
import UsersRegistrationHelper = require('../../helpers/users/users-registration-helper');

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

EosApi.initBlockchainLibraries();

const JEST_TIMEOUT = 5000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 1000;

describe('Affiliates referral processing', () => {
  let offer;

  beforeAll(async () => {
    await SeedsHelper.beforeAllSetting(beforeAfterOptions);
  });

  afterAll(async () => {
    await SeedsHelper.doAfterAll(beforeAfterOptions);
  });
  beforeEach(async () => {
    [userVlad, userJane, userPetr] = await SeedsHelper.beforeAllRoutine();

    ({ offer } = await AffiliatesGenerator.createPostAndOffer(userVlad));

    await StreamsCreatorService.createRegistrationStreamsForEverybody(offer);

    // Disturbance
    const { uniqueId: firstUniqueId } = await RedirectRequest.makeRedirectRequest(userPetr, offer);
    const { uniqueId: secondUniqueId } = await RedirectRequest.makeRedirectRequest(userPetr, offer);
    await RedirectRequest.makeRedirectRequest(userPetr, offer, firstUniqueId);
    await RedirectRequest.makeRedirectRequest(userPetr, offer, secondUniqueId);
  });

  describe('Positive', () => {
    it('A regular processing case', async () => {
      const [firstReferral, secondReferral, thirdReferral, forthReferral] = await Promise.all([
        // two referrals for vlad
        AffiliatesRequest.redirectAndRegisterAsReferral(userVlad, offer),
        AffiliatesRequest.redirectAndRegisterAsReferral(userVlad, offer),
        AffiliatesRequest.redirectAndRegisterAsReferral(userJane, offer),
        AffiliatesRequest.redirectAndRegisterAsReferral(userJane, offer),
      ]);

      // Only two of them seem to be ok
      const [
        firstReferralActivityId,
        secondReferralActivityId,
        thirdReferralActivityId,
        forthReferralActivityModel,
      ] = await Promise.all([
        UsersActivityCommonHelper.setBlockchainStatusIsSuccessByUserFromUserTo(firstReferral, userVlad),
        UsersActivityCommonHelper.setBlockchainStatusIsSuccessByUserFromUserTo(secondReferral, userVlad),
        UsersActivityCommonHelper.setBlockchainStatusIsSuccessByUserFromUserTo(thirdReferral, userJane),
        knex(UsersModelProvider.getUsersActivityTableName()).where({
          user_id_from: forthReferral.id,
          entity_id_to: userJane.id,
          entity_name: UsersModelProvider.getEntityName(),
        }).first(),
      ]);

      await RegistrationConversionProcessor.process();

      const [
        firstConversionModel,
        secondConversionModel,
        thirdConversionModel,
        forthConversionModel,
      ] = await Promise.all([
        ConversionsModel.query().findOne({ user_id: firstReferral.id, users_activity_id: firstReferralActivityId }),
        ConversionsModel.query().findOne({ user_id: secondReferral.id, users_activity_id: secondReferralActivityId }),
        ConversionsModel.query().findOne({ user_id: thirdReferral.id, users_activity_id: thirdReferralActivityId }),
        ConversionsModel.query().findOne({ user_id: forthReferral.id, users_activity_id: forthReferralActivityModel.id }),
      ]);

      expect(firstConversionModel.status).toBe(ProcessStatusesDictionary.success());
      expect(secondConversionModel.status).toBe(ProcessStatusesDictionary.success());
      expect(thirdConversionModel.status).toBe(ProcessStatusesDictionary.success());

      // third is not processed
      expect(forthConversionModel.status).toBe(ProcessStatusesDictionary.new());

      const [
        firstReferralIndex,
        secondReferralIndex,
        thirdReferralIndex,
        forthReferralIndex,
      ] = await Promise.all([
        UsersActivityReferralRepository.doesUserReferralExist(firstReferral.id, userVlad.id),
        UsersActivityReferralRepository.doesUserReferralExist(secondReferral.id, userVlad.id),
        UsersActivityReferralRepository.doesUserReferralExist(thirdReferral.id, userJane.id),
        UsersActivityReferralRepository.doesUserReferralExist(forthReferral.id, userJane.id),
      ]);

      expect(firstReferralIndex).toBe(true);
      expect(secondReferralIndex).toBe(true);
      expect(thirdReferralIndex).toBe(true);
      expect(forthReferralIndex).toBe(false);
    }, JEST_TIMEOUT * 5);
  });

  describe('Negative', () => {
    it('Duplicate users_activity_referral - status duplication and no index', async () => {
      const { uniqueId } = await RedirectRequest.makeRedirectRequest(userVlad, offer);

      const statusResponseBody: IResponseBody =
        await AffiliatesRequest.getRegistrationOfferReferralStatus(uniqueId);

      const registrationResponse = await UsersRegistrationHelper.registerNewUserWithRandomAccountData();

      const { body } = registrationResponse;
      const { user } = body;

      await AffiliatesRequest.sendReferralTransaction(
        uniqueId,
        body.token,
        statusResponseBody,
      );

      const firstActivityId =
        await UsersActivityCommonHelper.setBlockchainStatusIsSuccessByUserFromUserTo(user, userVlad);

      await AffiliatesRequest.sendReferralTransaction(
        uniqueId,
        body.token,
        statusResponseBody,
      );

      const secondActivityId =
        await UsersActivityCommonHelper.setBlockchainStatusIsSuccessByUserFromUserTo(user, userVlad);

      await RegistrationConversionProcessor.process();

      const [firstConversion, secondConversion] = await Promise.all([
        ConversionsModel.query().findOne({ user_id: user.id, users_activity_id: firstActivityId }),
        ConversionsModel.query().findOne({ user_id: user.id, users_activity_id: secondActivityId }),
      ]);

      expect(firstConversion.status).toBe(ProcessStatusesDictionary.success());
      expect(secondConversion.status).toBe(ProcessStatusesDictionary.duplicate());

      const referralIndex =
          await UsersActivityReferralRepository.doesUserReferralExist(user.id, userVlad.id);

      expect(referralIndex).toBe(true);
    }, JEST_TIMEOUT_DEBUG);
  });
});

export {};
