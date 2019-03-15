"use strict";
const errors_1 = require("../../api/errors");
const express = require('express');
const AirdropsUserRouter = express.Router();
require('express-async-errors');
// @ts-ignore
AirdropsUserRouter.get('/:airdrop_id/user', async (req, res) => {
    throw new errors_1.BadRequestError('Please use graphql implementation', 400);
});
module.exports = AirdropsUserRouter;
