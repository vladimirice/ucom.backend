"use strict";
const GithubAuthService = require("../service/github-auth-service");
const HttpRequestHelper = require("../../common/helper/http-request-helper");
const express = require('express');
const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;
const GithubAuthRouter = express.Router();
require('express-async-errors');
GithubAuthRouter.all('/auth_callback', async (req, res) => {
    const { redirectUri, authToken } = await GithubAuthService.processAuthCallback(req);
    res.cookie(CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB, authToken, {
        maxAge: GithubAuthService.getCookieExpiration(),
        httpOnly: false,
        domain: HttpRequestHelper.getCookieDomain(req),
    });
    res.redirect(redirectUri);
});
module.exports = GithubAuthRouter;
