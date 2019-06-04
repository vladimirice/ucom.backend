import { IResponseBody } from '../../../lib/common/interfaces/request-interfaces';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import RequestHelper = require('../../integration/helpers/request-helper');
import AffiliatesCommonHelper = require('./affiliates-common-helper');
import ResponseHelper = require('../../integration/helpers/response-helper');
import AffiliateUniqueIdService = require('../../../lib/affiliates/service/affiliate-unique-id-service');
import AffiliatesResponse = require('./affiliates-response');
import RedirectRequest = require('./redirect-request');
import OffersModel = require('../../../lib/affiliates/models/offers-model');
import UsersRegistrationHelper = require('../users/users-registration-helper');

const statuses = require('statuses');
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;

class AffiliatesRequest {
  public static getEventIdRegistration() {
    return EventsIds.registration();
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

  private static getAffiliatesRootUrl(): string {
    return `${RequestHelper.getApiV1Prefix()}/affiliates`;
  }
}

export = AffiliatesRequest;
