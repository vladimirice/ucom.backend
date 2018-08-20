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

  req.user.validate()
    .then((res) => {
      return req.user.update({
        ...parameters
      });
    })
    .then((user) => {
      res.send(req.user);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
});

module.exports = router;