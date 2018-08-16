const express = require('express');
const router  = express.Router();
const models  = require('../models');
const jwt      = require('jsonwebtoken');
const passport = require('passport');
const _ = require('lodash');
const EosJsEcc = require('../lib/crypto/eosjs-ecc');
const {AppError} = require('../lib/api/errors');
const usersSeeds = require('../seeders/eos_accounts');
const AuthValidator = require('../lib/auth/validators');
const config = require('config');

/* test method */
router.post('/generate_sign', async function (req, res, next) {
  const account_name = req.body.account_name;

  const sign = EosJsEcc.sign(account_name, usersSeeds[0].private_key);

  res.send({
    'sign': sign,
    'public_key': usersSeeds[0].public_key
  })

});

router.post('/register', async function (req, res, next) {
  const payload = _.pick(req.body, ['account_name', 'public_key', 'sign']);

  const { error } = AuthValidator.validateRegistration(req.body);
  if (error) {
    return res.status(400).send(AuthValidator.formatErrorMessages(error.details));
  }

  if (!EosJsEcc.isValidPublic(payload.public_key)) {
    return next(new AppError('Public key is not valid', 400));
  }

  let isSignValid, user;
  try {
    isSignValid = EosJsEcc.verify(payload.sign, payload.account_name, payload.public_key);

    if (!isSignValid) {
      return next(new AppError('Signature is not valid', 400));
    }

    user = await models.Users.findOne({where: {account_name: payload.account_name}});

    if (!user) {
      user = await models.Users.create({
        account_name: payload.account_name,
        nickname: payload.account_name,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    const token = jwt.sign(_.pick(user, ['id', 'account_name']), config.get('auth').jwt_secret_key);

    res.send({
      'success': true,
      'token': token,
      'user': user
    });

  } catch (e) {
    return next(new AppError(e.message, 400));
  }
});

/* POST login. */
router.post('/login', function (req, res, next) {

  passport.authenticate('local', {session: false}, (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        message: info ? info.message : 'Login failed',
        user   : user
      });
    }

    req.login(user.dataValues, {session: false}, (err) => {
      if (err) {
        res.send(err);
      }

      const token = jwt.sign(_.pick(user, ['id', 'email']), 'your_jwt_secret');

      return res.header('Authorization', `Bearer ${token}`).json({user});
    });
  })
  (req, res);

});

module.exports = router;