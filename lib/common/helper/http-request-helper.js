"use strict";
const config = require('config');
class HttpRequestHelper {
    static getCookieDomain(request) {
        const allowedOrigins = config.cors.allowed_origins;
        const { origin } = request.headers;
        if (allowedOrigins.includes(origin) && origin.includes('localhost')) {
            return 'localhost';
        }
        else {
            return 'u.community';
        }
    }
}
module.exports = HttpRequestHelper;
