const express = require('express');
const router  = express.Router();
const models  = require('../models');

const jwt      = require('jsonwebtoken');
const passport = require('passport');
const _ = require('lodash');
const EosJsEcc = require('../lib/crypto/eosjs-ecc');
const {AppError} = require('../lib/api/errors');

router.post('/register', async function (req, res, next) {
  const payload = _.pick(req.body, ['account_name', 'public_key', 'sign']);

  // TODO - validate input data
  // TODO change token secret phrase

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



    const token = jwt.sign(_.pick(user, ['id', 'account_name']), 'your_jwt_secret');

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