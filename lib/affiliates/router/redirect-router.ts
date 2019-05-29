import RedirectService = require('../service/redirect-service');

const express = require('express');
require('express-async-errors');

const RedirectRouter = express.Router();

// @ts-ignore
RedirectRouter.get('/:offerHash/:streamIdentity', async (req, res) => {
  await RedirectService.process(req);

  res.cookie(
    CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB,
    authToken,
    {
      maxAge: GithubAuthService.getCookieExpiration(),
      httpOnly: false,
      domain: HttpRequestHelper.getCookieDomain(req),
    },
  );


  res.redirect('https://app.example.io');
});

export = RedirectRouter;
