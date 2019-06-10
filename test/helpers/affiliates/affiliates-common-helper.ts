import AffiliateUniqueIdService = require('../../../lib/affiliates/service/affiliate-unique-id-service');

const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;


class AffiliatesCommonHelper {
  public static composeUniqueIdCookieString(uniqueId: string): string {
    const jwtToken = AffiliateUniqueIdService.generateJwtTokenWithUniqueId(uniqueId);

    return this.composeJwtTokenCookieString(jwtToken);
  }

  public static composeJwtTokenCookieString(jwtToken: string): string {
    return `${CommonHeaders.UNIQUE_ID}=${jwtToken}`;
  }
}

export = AffiliatesCommonHelper;
