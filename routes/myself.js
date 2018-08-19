const express = require('express');
const router = express.Router();
const passport = require('passport');
const UsersValidator = require('../lib/validator/users-validator');
const _ = require('lodash');

router.get('/', passport.authenticate('jwt', {session: false}), async function(req, res, next) {
  res.send(req.user)
});


router.patch('/', passport.authenticate('jwt', {session: false}), async function(req, res, next) {
  const parameters = _.pick(req.body, UsersValidator.getFields());

  // TODO - provide validation

  await req.user.update({
    ...parameters
  });

  res.send(req.user);
});

module.exports = router;