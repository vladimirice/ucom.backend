"use strict";
const winston_1 = require("../../../config/winston");
const errors_1 = require("../../api/errors");
const UsersExternalRepository = require("../../users-external/repository/users-external-repository");
const ExternalTypeIdDictionary = require("../../users-external/dictionary/external-type-id-dictionary");
const UsersExternalAuthLogRepository = require("../../users-external/repository/users-external-auth-log-repository");
const AuthService = require("../../auth/authService");
const NumbersHelper = require("../../common/helper/numbers-helper");
const request = require('request-promise-native');
const githubConfig = require('config').github;
const ACCESS_TOKEN_URI = '/login/oauth/access_token';
const FETCH_USER_DATA_VIA_TOKEN_URI = '/user?access_token=';
const TOKEN_EXPIRATION_IN_DAYS = 30;
class GithubAuthService {
    static getCookieExpiration() {
        return (3600 * 1000) * 24 * 30; // 1 month
    }
    static async processAuthCallback(req) {
        winston_1.AuthCallbackLogger.info(`Github callback. Method is: ${req.method}, query string content: ${JSON.stringify(req.query)}`);
        const { code, state } = req.query;
        if (!state || state !== githubConfig.state) {
            throw new errors_1.AppError('There is no state or state is not correct', 500);
        }
        if (!code) {
            throw new errors_1.AppError('There is no code in github callback', 500);
        }
        try {
            const token = await this.fetchTokenByCode(code);
            const userData = await this.fetchUserDataViaToken(token);
            const usersExternalId = await this.saveDataToDb(req, userData);
            const authToken = AuthService.getNewGithubAuthToken(usersExternalId, TOKEN_EXPIRATION_IN_DAYS);
            let redirectUri = githubConfig.default_redirect_uri;
            if (req.query && req.query.redirect_uri) {
                redirectUri = this.composeRedirectUrl(req.query);
            }
            return {
                redirectUri,
                authToken,
            };
        }
        catch (err) {
            throw this.processAuthError(err);
        }
    }
    static composeRedirectUrl(queryString) {
        const toExclude = ['redirect_uri', 'code', 'state'];
        const toAppend = [];
        for (const field in queryString) {
            if (!~toExclude.indexOf(field)) {
                toAppend.push(`${field}=${queryString[field]}`);
            }
        }
        if (toAppend.length === 0) {
            return queryString.redirect_uri;
        }
        return `${queryString.redirect_uri}&${toAppend.join('&')}`;
    }
    static async saveDataToDb(req, userData) {
        let externalId = userData.id;
        // TODO - disable this after testing
        if (req.query.mock_external_id) {
            externalId = NumbersHelper.generateRandomInteger(1, 10000000);
        }
        const usersExternalId = await UsersExternalRepository.upsertExternalUser(ExternalTypeIdDictionary.github(), externalId, userData.login, userData, null);
        await UsersExternalAuthLogRepository.insertOneAuthLog({
            json_headers: req.headers,
            json_body: req.query,
            json_value: userData,
            referer: req.query.redirect_uri,
            users_external_id: usersExternalId,
        });
        return usersExternalId;
    }
    static processAuthError(err) {
        if (err.name === 'StatusCodeError' && err.statusCode >= 400 && err.statusCode < 500 && err.message) {
            return new errors_1.BadRequestError(err.message, err.statusCode);
        }
        return err;
    }
    static async fetchTokenByCode(code) {
        const uri = `${githubConfig.main_uri}${ACCESS_TOKEN_URI}`;
        const options = {
            uri,
            method: 'POST',
            headers: {
                Accept: 'application/json',
            },
            form: {
                code,
                client_id: githubConfig.client_id,
                client_secret: githubConfig.client_secret,
                state: githubConfig.state,
            },
        };
        const res = await request(options);
        winston_1.AuthCallbackLogger.info(`Github token request response: ${JSON.stringify(res)}`);
        const data = JSON.parse(res);
        if (!data) {
            throw new errors_1.AppError('Malformed response data', 500);
        }
        if (data.error) {
            throw new errors_1.AppError(`${JSON.stringify(data)}`, 500);
        }
        if (!data.access_token) {
            throw new errors_1.AppError('There is no access token or data', 500);
        }
        return data.access_token;
    }
    static async fetchUserDataViaToken(accessToken) {
        const uri = `${githubConfig.api_uri}${FETCH_USER_DATA_VIA_TOKEN_URI}${accessToken}`;
        const data = await request({
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'User-Agent': githubConfig.app_name,
            },
            uri,
        });
        winston_1.AuthCallbackLogger.info(`Github public data response is: ${data}`);
        return JSON.parse(data);
    }
}
module.exports = GithubAuthService;
