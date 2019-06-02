import RequestHelper = require('../../integration/helpers/request-helper');
import AffiliatesCommonHelper = require('./affiliates-common-helper');
import ResponseHelper = require('../../integration/helpers/response-helper');
import AffiliateUniqueIdService = require('../../../lib/affiliates/service/affiliate-unique-id-service');

const statuses = require('statuses');
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;

class AffiliatesRequest {
  public static getEventIdRegistration() {
    return EventsIds.registration();
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
      expectedStatus
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
