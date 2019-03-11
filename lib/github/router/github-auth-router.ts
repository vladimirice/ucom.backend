import GithubAuthService = require('../service/github-auth-service');

const express = require('express');

const GithubAuthRouter = express.Router();

require('express-async-errors');

GithubAuthRouter.all('/auth_callback', async (req, res) => {
  const redirectUri = await GithubAuthService.processAuthCallback(req);

  res.redirect(redirectUri);
});

export = GithubAuthRouter;
