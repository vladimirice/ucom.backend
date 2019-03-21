"use strict";
const errors_1 = require("../api/errors");
const moment = require("moment");
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const config = require('config');
const authConfig = config.get('auth');
const passportJWT = require('passport-jwt');
const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;
const extractJWT = passportJWT.ExtractJwt;
const { AppError } = require('../api/errors');
class AuthService {
    static getIdsFromAuthTokens(req) {
        const res = {
            currentUserId: null,
            usersExternalId: null,
        };
        const githubToken = req.headers[CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB];
        const currentUserId = this.extractCurrentUserByToken(req);
        if (currentUserId) {
            res.currentUserId = currentUserId;
        }
        if (githubToken) {
            res.usersExternalId = this.extractUsersExternalIdByTokenOrError(githubToken);
        }
        return res;
    }
    static getNewJwtToken(user) {
        return jwt.sign(_.pick(user, ['id', 'account_name']), config.get('auth').jwt_secret_key);
    }
    static getNewGithubAuthToken(externalUsersId, expirationInDays) {
        const toSign = {
            externalUsersId,
        };
        this.addExpiredAt(toSign, expirationInDays);
        return jwt.sign(toSign, authConfig.jwt_secret_key);
    }
    /**
     *
     * @param {string} jwtToken
     * @return {number}
     */
    static extractCurrentUserIdByTokenOrError(jwtToken) {
        const secretOrKey = config.get('auth').jwt_secret_key;
        try {
            const jwtData = jwt.verify(jwtToken, secretOrKey);
            return +jwtData.id;
        }
        catch (err) {
            if (err.message === 'invalid signature') {
                throw new AppError('Auth is required', 401);
            }
            throw err;
        }
    }
    static extractUsersExternalIdByTokenOrError(jwtToken) {
        try {
            const jwtData = jwt.verify(jwtToken, authConfig.jwt_secret_key);
            this.exceptionIfExpired(jwtData);
            if (!jwtData.externalUsersId) {
                throw new errors_1.HttpUnauthorizedError('Provided token is not valid');
            }
            return +jwtData.externalUsersId;
        }
        catch (err) {
            if (err.message === 'invalid signature') {
                throw new errors_1.HttpUnauthorizedError('Provided token is not valid');
            }
            throw err;
        }
    }
    static extractUsersExternalIdFromGithubAuthTokenOrError(req) {
        const jwtToken = req.headers[CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB];
        if (!jwtToken) {
            throw new errors_1.HttpUnauthorizedError('Please provide valid Github auth token');
        }
        return this.extractUsersExternalIdByTokenOrError(jwtToken);
    }
    static extractCurrentUserIdFromReqOrError(req) {
        const jwtToken = extractJWT.fromAuthHeaderAsBearerToken()(req);
        if (!jwtToken) {
            throw new errors_1.HttpUnauthorizedError('There is no Authorization Bearer token');
        }
        return this.extractCurrentUserIdByTokenOrError(jwtToken);
    }
    static extractCurrentUserByToken(req) {
        const jwtToken = extractJWT.fromAuthHeaderAsBearerToken()(req);
        if (!jwtToken) {
            return null;
        }
        const secretOrKey = config.get('auth').jwt_secret_key;
        try {
            const jwtData = jwt.verify(jwtToken, secretOrKey);
            return jwtData.id;
        }
        catch (err) {
            if (err.message === 'invalid signature') {
                throw new AppError('Auth is required', 401);
            }
            throw err;
        }
    }
    static addExpiredAt(toSign, expirationInDays) {
        toSign.expiredAt = moment().add(expirationInDays, 'days').utc().format();
    }
    static exceptionIfExpired(jwtData) {
        if (!jwtData.expiredAt) {
            throw new errors_1.BadRequestError('Malformed token - expiredAt field is required');
        }
        const expiredAt = moment(jwtData.expiredAt);
        const now = moment();
        if (now > expiredAt) {
            throw new errors_1.HttpUnauthorizedError('Token is expired');
        }
    }
}
module.exports = AuthService;
