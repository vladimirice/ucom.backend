import GithubAuthService = require('../../github/service/github-auth-service');
import AuthService = require('../../auth/authService');
import { BadRequestError } from '../../api/errors';

const express = require('express');

const AirdropsUserRouter = express.Router();

require('express-async-errors');

AirdropsUserRouter.get('/:airdrop_id/user', async (req, res) => {
  const token = req.cookies[GithubAuthService.getCookieName()];

  if (!token) {
    throw new BadRequestError('Github token should be provided via cookie', 401);
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

export = AirdropsUserRouter;
