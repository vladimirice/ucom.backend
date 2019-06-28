"use strict";
const RedirectService = require("../service/redirect-service");
const express = require('express');
require('express-async-errors');
const RedirectRouter = express.Router();
RedirectRouter.get('/:offerHash/:streamIdentity', async (req, res) => {
    const stream = await RedirectService.process(req, res);
    res.redirect(stream.landing_url);
});
module.exports = RedirectRouter;
