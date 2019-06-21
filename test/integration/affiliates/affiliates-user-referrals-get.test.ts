import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { IResponseBody } from '../../../lib/common/interfaces/request-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import AffiliatesRequest = require('../../helpers/affiliates/affiliates-request');
import ResponseHelper = require('../helpers/response-helper');
import AffiliatesBeforeAllHelper = require('../../helpers/affiliates/affiliates-before-all-helper');

import OneUserRequestHelper = require('../../helpers/users/one-user-request-helper');
import StreamsModel = require('../../../lib/affiliates/models/streams-model');
import StreamsCreatorService = require('../../../lib/affiliates/service/streams-creator-service');
import UsersRegistrationHelper = require('../../helpers/users/users-registration-helper');
import MockHelper = require('../helpers/mock-helper');
import UosAccountsPropertiesUpdateService = require('../../../lib/uos-accounts-properties/service/uos-accounts-properties-update-service');
import CommonChecker = require('../../helpers/common/common-checker');
import CommonHelper = require('../helpers/common-helper');
// @ts-ignore
import UsersHelper = require('../helpers/users-helper');

require('jest-expect-message');

let userVlad:   UserModel;
let userJane:   UserModel;
let userPetr:   UserModel;
let userRokky:   UserModel;

const JEST_TIMEOUT = 5000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 1000;

describe('Affiliates user referrals', () => {
  let offer;

  beforeAll(async () => {
    await SeedsHelper.withGraphQlMockAllWorkers();
  });
  afterAll(async () => {
    await SeedsHelper.afterAllWithGraphQl();
  });
  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();

    ({ offer } = await AffiliatesBeforeAllHelper.beforeAll(userVlad, userPetr));

    await MockHelper.mockUosAccountsPropertiesFetchService(userVlad, userJane, userPetr, userRokky);
    await UosAccountsPropertiesUpdateService.updateAll();
  }, JEST_TIMEOUT * 2);

  describe('Myself data', () => {
    it('register a new user and do not create a stream for him but then create', async () => {
      const { body } = await UsersRegistrationHelper.registerNewUserWithRandomAccountData();

      const { user } = body;
      user.token = body.token;

      const myself: IResponseBody = await OneUserRequestHelper.getMyself(user);

      expect(myself.affiliates.referral_redirect_url).toBeNull();
      expect(myself.affiliates.source_user).toBeNull();

      await StreamsCreatorService.createRegistrationStreamsForEverybody(offer);
      const myselfWithReferralUrl: IResponseBody = await OneUserRequestHelper.getMyself(user);

      const stream = await StreamsModel.query().findOne({ account_name: myselfWithReferralUrl.account_name });
      expect(myselfWithReferralUrl.affiliates.referral_redirect_url).toBe(stream.redirect_url);
      expect(myselfWithReferralUrl.affiliates.source_user).toBeNull();
    }, JEST_TIMEOUT);

    it('get both myself referrer link and source user card', async () => {
      const referralToSource = await AffiliatesRequest.createManyReferralsWithBlockchainStatus([
        userVlad,
      ], offer);

      await StreamsCreatorService.createRegistrationStreamsForEverybody(offer);

      const myself: IResponseBody = await OneUserRequestHelper.getMyself(referralToSource[0].referral);

      const stream = await StreamsModel.query().findOne({ account_name: myself.account_name });
      expect(myself.affiliates.referral_redirect_url).toBe(stream.redirect_url);

      expect(myself.affiliates.source_user.id).toBe(userVlad.id);
    }, JEST_TIMEOUT);
  });

  describe('One user referrals', () => {
    describe('Positive', () => {
      it('Get as guest', async () => {
        const emptyList = await AffiliatesRequest.getOneUserReferrals(userVlad.id);
        ResponseHelper.checkEmptyResponseList(emptyList);

        const referralToSource = await AffiliatesRequest.createManyReferralsWithBlockchainStatus([
          userVlad,
          userVlad,
          userVlad,
          userJane,
        ], offer);

        const vladReferrals: number[] = [];
        const janeReferrals: number[] = [];
        for (const item of referralToSource) {
          await UsersHelper.initUosAccountsProperties(item.referral);

          if (item.source.id === userVlad.id) {
            vladReferrals.push(item.referral.id);
          } else if (item.source.id === userJane.id) {
            janeReferrals.push(item.referral.id);
          }
        }

        const vladReferralsList = await AffiliatesRequest.getOneUserReferrals(userVlad.id);
        CommonChecker.expectModelIdsExistenceInResponseList(vladReferralsList, vladReferrals);

        const janeReferralsList = await AffiliatesRequest.getOneUserReferrals(userJane.id);
        CommonChecker.expectModelIdsExistenceInResponseList(janeReferralsList, janeReferrals);

        const petrReferralsList = await AffiliatesRequest.getOneUserReferrals(userPetr.id);
        ResponseHelper.checkEmptyResponseList(petrReferralsList);

        CommonHelper.checkUsersListResponseWithProps(vladReferralsList, true);
      }, JEST_TIMEOUT * 5);

      it('GET myself referrals, ordered by id DESC with a pagination', async () => {
        const orderBy = 'id';

        const referralToSource = await AffiliatesRequest.createManyReferralsWithBlockchainStatus([
          userVlad,
          userVlad,
          userVlad,
          userVlad,
        ], offer);

        for (const item of referralToSource) {
          await UsersHelper.initUosAccountsProperties(item.referral);
        }

        const referralsIds: number[] = referralToSource.map(item => +item.referral.id).sort();

        const page = 2;
        const perPage = 2;

        const response = await AffiliatesRequest.getOneUserReferrals(userVlad.id, orderBy, page, perPage);

        CommonChecker.expectModelIdsExistenceInResponseList(response, [referralsIds[2], referralsIds[3]]);

        expect(response.metadata.total_amount).toBe(4);
        expect(response.metadata.has_more).toBe(false);

        CommonHelper.checkUsersListResponseWithProps(response, true);
      }, JEST_TIMEOUT * 5);
    });
  });
});

export {};
