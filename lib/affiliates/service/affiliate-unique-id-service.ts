import HttpRequestHelper = require('../../common/helper/http-request-helper');
import DatetimeHelper = require('../../common/helper/datetime-helper');
import AuthService = require('../../auth/authService');
const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;

const uniqueIdGenerator = require('uniqid');

class AffiliateUniqueIdService {
  public static processUniqIdCookie(request: any, response: any) {
    // @ts-ignore
    const { jwtToken, uniqueId } = this.getJwtTokenAndUniqueId(request);

    response.cookie(
      CommonHeaders.UNIQUE_ID,
      jwtToken,
      {
        maxAge: this.getUniqIdCookieExpiration(),
        httpOnly: true,
        secure: true,
        domain: HttpRequestHelper.getCookieDomain(request),
      },
    );
  }

  private static extractUniqueIdFromJwtToken(jwtToken: string): string {
    const data = AuthService.extractJwtDataOrUnauthorizedError(jwtToken);

    return data.uniqueId;
  }

  private static getJwtTokenAndUniqueId(request: any): { jwtToken: string, uniqueId: string} {
    if (request.cookies[CommonHeaders.UNIQUE_ID]) {
      const jwtToken = request.cookies[CommonHeaders.UNIQUE_ID];

      return {
        jwtToken,
        uniqueId: this.extractUniqueIdFromJwtToken(jwtToken),
      };
    }

    return this.getNewJwtTokenAndUniqueId();
  }

  public static getNewJwtTokenAndUniqueId(): { uniqueId: string, jwtToken: string } {
    const uniqueId: string = uniqueIdGenerator();
    const createdAt: string = DatetimeHelper.currentDatetime();

    const toSign = {
      createdAt,
      uniqueId,
    };

    const jwtToken = AuthService.signDataAndGetJwtToken(toSign);

    return {
      jwtToken,
      uniqueId,
    }
  }

  private static getUniqIdCookieExpiration(): number {
    return (3600 * 1000) * 24 * 365; // 1 year
  }
}

export = AffiliateUniqueIdService;
