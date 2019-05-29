import RedirectService = require('../service/redirect-service');
import AffiliateUniqueIdService = require('../service/affiliate-unique-id-service');
const express = require('express');
require('express-async-errors');

const RedirectRouter = express.Router();

// @ts-ignore
RedirectRouter.get('/:offerHash/:streamIdentity', async (req, res) => {
  AffiliateUniqueIdService.processUniqIdCookie(req, res);

  await RedirectService.process(req);

  res.redirect('https://app.example.io');
});

export = RedirectRouter;
