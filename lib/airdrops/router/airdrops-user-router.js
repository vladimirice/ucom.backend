"use strict";
const GithubAuthService = require("../../github/service/github-auth-service");
const AuthService = require("../../auth/authService");
const express = require('express');
const AirdropsUserRouter = express.Router();
require('express-async-errors');
AirdropsUserRouter.get('/:airdrop_id/user', async (req, res) => {
    const token = req.cookies[GithubAuthService.getCookieName()];
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
