import HttpRequestHelper = require('../../common/helper/http-request-helper');
import DatetimeHelper = require('../../common/helper/datetime-helper');
import AuthService = require('../../auth/authService');
import { StringToAnyCollection } from '../../common/interfaces/common-types';
const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;

const uniqueIdGenerator = require('uniqid');

class AffiliateUniqueIdService {
  public static processUniqIdCookie(request: any, response: any): string {
    const { jwtToken, uniqueId } = this.getJwtTokenAndUniqueId(request);

    response.cookie(
      CommonHeaders.UNIQUE_ID,
      jwtToken,
      {
        maxAge: this.getUniqIdCookieExpiration(),
        httpOnly: true,
        secure: true,
        domain: HttpRequestHelper.getCookieDomain(request),
      }
    );

    return uniqueId;
  }

  public static getUniqueIdJwtTokenFromCookieOrNull(request: StringToAnyCollection): string | null {
    return request.cookies[CommonHeaders.UNIQUE_ID] || null;
  }

  public static extractUniqueIdFromRequestOrNull(request: StringToAnyCollection): string | null {
    const jwtToken = this.getUniqueIdJwtTokenFromCookieOrNull(request);

    if (!jwtToken) {
      return null;
    }

    return this.extractUniqueIdFromJwtTokenOrUnauthorizedError(jwtToken);
  }

  public static extractUniqueIdFromJwtTokenOrUnauthorizedError(jwtToken: string): string {
    const data = AuthService.extractJwtDataOrUnauthorizedError(jwtToken);

    return data.uniqueId;
  }

  private static getJwtTokenAndUniqueId(request: any): { jwtToken: string, uniqueId: string} {
    const jwtToken = this.getUniqueIdJwtTokenFromCookieOrNull(request);

    if (jwtToken === null) {
      return this.getNewJwtTokenAndUniqueId();
    }

    return {
      jwtToken,
      uniqueId: this.extractUniqueIdFromJwtTokenOrUnauthorizedError(jwtToken),
    };
  }

  public static getNewJwtTokenAndUniqueId(): { uniqueId: string, jwtToken: string } {
    const uniqueId: string = uniqueIdGenerator();

    const jwtToken = this.generateJwtTokenWithUniqueId(uniqueId);

    return {
      jwtToken,
      uniqueId,
    }
  }

  public static generateJwtTokenWithUniqueId(uniqueId: string): string {
    const createdAt: string = DatetimeHelper.currentDatetime();

    const toSign = {
      createdAt,
      uniqueId,
    };

    return AuthService.signDataAndGetJwtToken(toSign);
  }

  private static getUniqIdCookieExpiration(): number {
    return (3600 * 1000) * 24 * 365; // 1 year
  }
}

export = AffiliateUniqueIdService;
