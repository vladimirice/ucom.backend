"use strict";
const express = require('express');
require('express-async-errors');
const RedirectRouter = express.Router();
RedirectRouter.get('/:stream_id', async (req, res) => {
    res.status(200).send({
        message: `Hello with stream ID: ${req.params.stream_id}`,
    });
});
module.exports = RedirectRouter;
