"use strict";
const HttpRequestHelper = require("../../common/helper/http-request-helper");
const DatetimeHelper = require("../../common/helper/datetime-helper");
const AuthService = require("../../auth/authService");
const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;
const uniqueIdGenerator = require('uniqid');
class AffiliateUniqueIdService {
    static processUniqIdCookie(request, response) {
        const { jwtToken, uniqueId } = this.getJwtTokenAndUniqueId(request);
        response.cookie(CommonHeaders.UNIQUE_ID, jwtToken, {
            maxAge: this.getUniqIdCookieExpiration(),
            httpOnly: true,
            secure: true,
            domain: HttpRequestHelper.getCookieDomain(request),
        });
        return uniqueId;
    }
    static getUniqueIdJwtTokenFromCookieOrNull(request) {
        return request.cookies[CommonHeaders.UNIQUE_ID] || null;
    }
    static extractUniqueIdFromJwtTokenOrUnauthorizedError(jwtToken) {
        const data = AuthService.extractJwtDataOrUnauthorizedError(jwtToken);
        return data.uniqueId;
    }
    static getJwtTokenAndUniqueId(request) {
        const jwtToken = this.getUniqueIdJwtTokenFromCookieOrNull(request);
        if (jwtToken === null) {
            return this.getNewJwtTokenAndUniqueId();
        }
        return {
            jwtToken,
            uniqueId: this.extractUniqueIdFromJwtTokenOrUnauthorizedError(jwtToken),
        };
    }
    static getNewJwtTokenAndUniqueId() {
        const uniqueId = uniqueIdGenerator();
        const jwtToken = this.generateJwtTokenWithUniqueId(uniqueId);
        return {
            jwtToken,
            uniqueId,
        };
    }
    static generateJwtTokenWithUniqueId(uniqueId) {
        const createdAt = DatetimeHelper.currentDatetime();
        const toSign = {
            createdAt,
            uniqueId,
        };
        return AuthService.signDataAndGetJwtToken(toSign);
    }
    static getUniqIdCookieExpiration() {
        return (3600 * 1000) * 24 * 365; // 1 year
    }
}
module.exports = AffiliateUniqueIdService;
