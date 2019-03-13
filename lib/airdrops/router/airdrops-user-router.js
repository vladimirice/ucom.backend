"use strict";
const errors_1 = require("../../api/errors");
const GithubAuthService = require("../../github/service/github-auth-service");
const AuthService = require("../../auth/authService");
const express = require('express');
const AirdropsUserRouter = express.Router();
require('express-async-errors');
AirdropsUserRouter.get('/:airdrop_id/user', async (req, res) => {
    const token = req.cookies[GithubAuthService.getCookieName()];
    if (!token) {
        throw new errors_1.BadRequestError('Github token should be provided via cookie', 401);
    }
    AuthService.extractUsersExternalIdByTokenOrError(token);
    const sampleResponse = {
        github_score: 550.044,
        tokens: [
            {
                amount: 50025,
                symbol: 'UOS',
            },
            {
                amount: 82678,
                symbol: 'FN',
            },
        ],
    };
    res.send(sampleResponse);
});
module.exports = AirdropsUserRouter;
