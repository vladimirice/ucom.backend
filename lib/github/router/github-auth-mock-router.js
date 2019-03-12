"use strict";
const errors_1 = require("../../api/errors");
const EnvHelper = require("../../common/helper/env-helper");
const GithubSampleValues = require("../../../test/helpers/github-sample-values");
const express = require('express');
const GithubAuthMockRouter = express.Router();
require('express-async-errors');
// @ts-ignore
GithubAuthMockRouter.post('/login/oauth/access_token', async (req, res) => {
    if (EnvHelper.isNotTestEnv()) {
        throw new errors_1.BadRequestError('Not found', 404);
    }
    res.send({
        access_token: 'cb259e0f9ea2b0dc02323e74d3b6667e8ce6868e',
        token_type: 'bearer',
        scope: '',
    });
});
// @ts-ignore
GithubAuthMockRouter.get('/user', async (req, res) => {
    if (EnvHelper.isNotTestEnv()) {
        throw new errors_1.BadRequestError('Not found', 404);
    }
    const result = GithubSampleValues.getVladSampleExternalData();
    res.send(result);
});
module.exports = GithubAuthMockRouter;
