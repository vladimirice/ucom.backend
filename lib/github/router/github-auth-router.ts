import GithubAuthService = require('../service/github-auth-service');

const express = require('express');

const GithubAuthRouter = express.Router();

require('express-async-errors');

GithubAuthRouter.all('/auth_callback', async (req, res) => {
  const { redirectUri, authToken } = await GithubAuthService.processAuthCallback(req);

  res.cookie(
    GithubAuthService.getCookieName(),
    authToken,
    {
      maxAge: GithubAuthService.getCookieExpiration(),
      httpOnly: true,
    },
  );

  res.redirect(redirectUri);
});

export = GithubAuthRouter;
