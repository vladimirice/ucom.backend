import UsersExternalUserPairService = require('../service/users-external-user-pair-service');

const express = require('express');

// @ts-ignore
const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;

const UsersExternalRouter = express.Router();

require('express-async-errors');

// @ts-ignore
UsersExternalRouter.all('/users/pair', async (req, res) => {
  const { status, message } = await UsersExternalUserPairService.pair(req);

  res.status(status).send(message);
});

export = UsersExternalRouter;
