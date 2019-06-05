import { IResponseBody } from '../../../lib/common/interfaces/request-interfaces';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlRequestHelper } from '../common/graphql-request-helper';

const statuses = require('statuses');
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const { GraphQLSchema } = require('ucom-libs-graphql-schemas');

import RequestHelper = require('../../integration/helpers/request-helper');
import AffiliatesCommonHelper = require('./affiliates-common-helper');
import ResponseHelper = require('../../integration/helpers/response-helper');
import AffiliateUniqueIdService = require('../../../lib/affiliates/service/affiliate-unique-id-service');
import AffiliatesResponse = require('./affiliates-response');
import RedirectRequest = require('./redirect-request');
import OffersModel = require('../../../lib/affiliates/models/offers-model');
import UsersRegistrationHelper = require('../users/users-registration-helper');
import UsersActivityCommonHelper = require('../users/activity/users-activity-common-helper');
import RegistrationConversionProcessor = require('../../../lib/affiliates/service/conversions/registration-conversion-processor');


class AffiliatesRequest {
  public static getEventIdRegistration() {
    return EventsIds.registration();
  }

  public static async createManyReferralsWithBlockchainStatus(
    usersSources: UserModel[],
    offer: OffersModel,
    processConversions: boolean = true,
  ): Promise<{referral, source}[]> {
    const referralToSource: {referral, source}[] = [];

    for (const source of usersSources) {
      const referral = await AffiliatesRequest.redirectAndRegisterAsReferral(source, offer);

      await UsersActivityCommonHelper.setBlockchainStatusIsSuccessByUserFromUserTo(referral, source);

      referralToSource.push({
        referral,
        source,
      });
    }

    if (processConversions) {
      await RegistrationConversionProcessor.process();
    }

    return referralToSource;
  }

  public static async redirectAndRegisterAsReferral(
    streamOwner: UserModel,
    offer: OffersModel,
  ): Promise<UserModel> {
    const { uniqueId }        = await RedirectRequest.makeRedirectRequest(streamOwner, offer);
    const statusResponseBody  = await AffiliatesRequest.getRegistrationOfferReferralStatus(uniqueId);

    const response = await UsersRegistrationHelper.registerNewUserWithRandomAccountData();

    await AffiliatesRequest.sendReferralTransaction(
      uniqueId,
      response.body.token,
      statusResponseBody,
    );

    response.body.user.token = response.body.token;

    return response.body.user;
  }

  public static async sendReferralTransaction(
    uniqueId: string,
    authToken: string,
    statusResponseBody: IResponseBody,
    signedTransaction: string = 'sample_signed_transaction', // only for mocked blockchain
  ) {
    const url     = `${this.getAffiliatesRootUrl()}/referral-transaction`;
    const request = RequestHelper.getRequestObjForPost(url);

    RequestHelper.addCookies(request, [
      AffiliatesCommonHelper.composeUniqueIdCookieString(uniqueId),
    ]);

    RequestHelper.addAuthTokenString(request, authToken);

    const fields = {
      ...AffiliatesResponse.getAffiliatesActionData(statusResponseBody),
      signed_transaction: signedTransaction,
    };

    RequestHelper.addFieldsToRequest(request, fields);

    const response = await request;
    ResponseHelper.expectStatusCreated(response);

    return response.body;
  }

  public static async getRegistrationOfferReferralStatus(
    uniqueId: string | null = null,
    expectedStatus: number = statuses('OK'),
  ): Promise<any> {
    let jwtToken: string | null = null;
    if (uniqueId !== null) {
      jwtToken = AffiliateUniqueIdService.generateJwtTokenWithUniqueId(uniqueId);
    }

    return this.makeRequestForReferralPrograms(
      jwtToken,
      EventsIds.registration(),
      expectedStatus,
    );
  }

  public static async makeRequestForReferralPrograms(
    jwtToken: string | null = null,
    eventId: number | null = null,
    expectedStatus: number = statuses('OK'),
  ) {
    const url = `${this.getAffiliatesRootUrl()}/actions`;
    const request = RequestHelper.getRequestObjForPost(url);

    if (jwtToken !== null) {
      RequestHelper.addCookies(request, [
        AffiliatesCommonHelper.composeJwtTokenCookieString(jwtToken),
      ]);
    }

    if (eventId !== null) {
      RequestHelper.addFieldsToRequest(request, {
        event_id: eventId,
      });
    }

    const response = await request;
    ResponseHelper.expectStatusToBe(response, expectedStatus);

    return response.body;
  }

  public static async getOneUserReferrals(
    userId: number,
    orderBy: string = '-account_name',
    page: number = 1,
    perPage: number = 10,
  ): Promise<any> {
    const params = {
      filters: {
        user_id: userId,
      },
      order_by: orderBy,
      page,
      per_page: perPage,
    };

    const part = GraphQLSchema.getOneUserReferralsQueryPart(params);

    const query = GraphQLSchema.getQueryMadeFromParts([part]);
    const key: string = 'one_user_referrals';

    const response = await GraphqlRequestHelper.makeRequestAsGuest(query, key, false);

    ResponseHelper.checkListResponseStructure(response);

    return response;
  }


  private static getAffiliatesRootUrl(): string {
    return `${RequestHelper.getApiV1Prefix()}/affiliates`;
  }
}

export = AffiliatesRequest;
