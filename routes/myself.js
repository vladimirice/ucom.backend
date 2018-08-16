const express = require('express');
const router = express.Router();
let models = require('../models');
const {AppError} = require('../lib/api/errors');
const passport = require('passport');

router.get('/', passport.authenticate('jwt', {session: false}), async function(req, res, next) {
  res.send(req.user)
});

module.exports = router;