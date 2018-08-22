const express = require('express');
const router  = express.Router();
const models  = require('../models');
const jwt      = require('jsonwebtoken');
const passport = require('passport');
const _ = require('lodash');
const EosJsEcc = require('../lib/crypto/eosjs-ecc');
const {AppError} = require('../lib/api/errors');
const AuthValidator = require('../lib/auth/validators');
const config = require('config');
const AuthService = require('../lib/auth/authService');
const eosApi = require('../lib/eos/eosApi');

/* test method */
router.post('/generate_sign', async function (req, res, next) {
  // const account_name = req.body.account_name;
  //
  // const sign = EosJsEcc.sign(account_name, usersSeeds[0].private_key);
  //
  // res.send({
  //   'sign': sign,
  //   'public_key': usersSeeds[0].public_key
  // })

  res.status(404).send();

});

router.post('/login', async function (req, res, next) {
  const payload = _.pick(req.body, ['account_name', 'public_key', 'sign']);

  const { error } = AuthValidator.validateRegistration(req.body);
  if (error) {
    return res.status(400).send({
      "errors": AuthValidator.formatErrorMessages(error.details)
    });
  }

  const user = await models['Users'].findOne({where: {account_name: payload.account_name}});

  if (!user) {
    return res.status(400).send({
      'errors' : [
        {
          'field': 'account_name',
          'message': 'Such account does not exist in blockchain'
        }
      ]
    });
  }

  if (!EosJsEcc.isValidPublic(payload.public_key)) {
    return next(new AppError('Public key is not valid', 400));
  }

  let isSignValid;
  try {
    isSignValid = EosJsEcc.verify(payload.sign, payload.account_name, user.public_key);

    if (!isSignValid) {
      return res.status(400).send({
        'errors' : [
          {
            'field': 'account_name',
            'message': 'Such account does not exist in blockchain'
          }
        ]
      });
    }

    const doesAccountExists = await eosApi.doesAccountExist(payload.account_name);

    if(!doesAccountExists) {
      return res.status(400).send({
        'errors' : [
          {
            'field': 'account_name',
            'message': 'Such account does not exists in blockchain'
          }
        ]
      });
    }

    if (!user) {
      res.send({
        'errors': {
          'account_name': 'This user is not registered'
        }
      });
    }

    const token = AuthService.getNewJwtToken(user);

    res.send({
      'success': true,
      'token': token,
      'user': user
    });

  } catch (e) {
    return next(new AppError(e.message, 400));
  }
});

module.exports = router;