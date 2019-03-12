"use strict";
const GithubAuthService = require("../../github/service/github-auth-service");
const AuthService = require("../../auth/authService");
const errors_1 = require("../../api/errors");
const express = require('express');
const AirdropsUserRouter = express.Router();
require('express-async-errors');
AirdropsUserRouter.get('/:airdrop_id/user', async (req, res) => {
    const token = req.cookies[GithubAuthService.getCookieName()];
    if (!token) {
        throw new errors_1.BadRequestError('Github token should be provided via cookie', 401);
    }
    AuthService.extractUsersExternalIdByTokenOrError(token);
    res.send({
        airdrop_id: +req.params.airdrop_id,
        rates: {
            total: 100500,
            myself: 200,
        },
    });
});
module.exports = AirdropsUserRouter;
