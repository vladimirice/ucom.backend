"use strict";
const UsersExternalUserPairService = require("../service/users-external-user-pair-service");
const express = require('express');
const UsersExternalRouter = express.Router();
require('express-async-errors');
UsersExternalRouter.post('/users/pair', async (req, res) => {
    const { status, message } = await UsersExternalUserPairService.pair(req);
    res.status(status).send(message);
});
module.exports = UsersExternalRouter;
