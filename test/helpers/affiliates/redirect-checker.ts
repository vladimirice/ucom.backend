import AuthService = require('../../../lib/auth/authService');
const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;

class RedirectChecker {
  public static checkUniqueIdCookieAndGetUniqueId(response): string {
    expect(Array.isArray(response.headers['set-cookie'])).toBeTruthy();
    expect(response.headers['set-cookie'].length).toBe(1);
    const uniqueIdCookie = response.headers['set-cookie'][0].split(';')[0].split('=');

    expect(uniqueIdCookie[0]).toBe(CommonHeaders.UNIQUE_ID);
    const jwtData = AuthService.extractJwtDataOrUnauthorizedError(uniqueIdCookie[1]);

    return jwtData.uniqueId;
  }
}

export = RedirectChecker;
