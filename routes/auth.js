const express = require('express');
const router  = express.Router();
const _ = require('lodash');
const EosJsEcc = require('../lib/crypto/eosjs-ecc');
const {AppError} = require('../lib/api/errors');
const AuthValidator = require('../lib/auth/validators');
const AuthService = require('../lib/auth/authService');
const eosApi = require('../lib/eos/eosApi');
const UsersService = require('../lib/users/users-service');

const multer = require('multer');
const upload = multer();

router.post('/login', [upload.array()], async function (req, res, next) {
  const payload = _.pick(req.body, ['account_name', 'public_key', 'sign']);

  const { error } = AuthValidator.validateLogin(req.body);
  if (error) {
    return res.status(400).send({
      "errors": AuthValidator.formatErrorMessages(error.details)
    });
  }

  const user = await UsersService.findOneByAccountName(payload.account_name);

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