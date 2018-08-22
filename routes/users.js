const express = require('express');
const router = express.Router();
let models = require('../models');
const {AppError} = require('../lib/api/errors');
const passport = require('passport');
const UsersRepository = require('../lib/users/users-repository');

/* GET users listing. */
router.get('/:user_id', async function(req, res, next) {
  const userId = parseInt(req.params.user_id);
  const user = await UsersRepository.getUserById(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.send(user);
});

router.get('/', async function(req, res, next) {
  const user = await models.Users.findAll();
  res.send(user);
});

router.post('/sample', passport.authenticate('jwt', {session: false}), async function(req, res, next) {
  res.send({
    'message': 'successful login!'
  })
});

module.exports = router;
