import RedirectService = require('../service/redirect-service');
import StreamsModel = require('../models/streams-model');
const express = require('express');
require('express-async-errors');

const RedirectRouter = express.Router();

RedirectRouter.get('/:offerHash/:streamIdentity', async (req, res) => {
  const stream: StreamsModel = await RedirectService.process(req, res);

  res.redirect(stream.landing_url);
});

export = RedirectRouter;
