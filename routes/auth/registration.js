const express = require('express');
const router  = express.Router();
const _ = require('lodash');
const EosJsEcc = require('../../lib/crypto/eosjs-ecc');
const {AppError} = require('../../lib/api/errors');
const AuthValidator = require('../../lib/auth/validators');
const AuthService = require('../../lib/auth/authService');
const eosApi = require('../../lib/eos/eosApi');
const UsersService = require('../../lib/users/users-service');
const EosAuth = require('../../lib/eos/eos-auth');
const models = require('../../models');

/* Check is account_name valid */
router.post('/validate-account-name', async function (req, res) {
  const account_name = req.body['account_name'];

  if (!account_name) {
    return res.status(400).send({
      'errors': {
        'account_name': 'Account name parameter is required'
      }
    });
  }

  // TODO - only for MVP in order to avoid questions
  const premiumAccounts = [
    'vlad', 'jane'
  ];

  if (premiumAccounts.indexOf(account_name) === -1
    && account_name.match(/^[a-z1-5]{12}$/) === null) {
    return res.status(400).send({
      'errors': {
        'account_name': 'Account name must contain only a-z or 1-5 and must have exactly 12 symbols length'
      }
    });
  }

  if (!await EosAuth.isAccountAvailable(account_name)) {
    return res.status(400).send({
      'errors': {
        'account_name': 'That account name is taken. Try another'
      }
    });
  }


  res.send({
    status: 'ok'
  })
});

/* Register new user */
router.post('/', async function (req, res, next) {
  const payload = _.pick(req.body, ['account_name', 'public_key', 'sign', 'brainkey']);

  const { error } = AuthValidator.validateReg(req.body);
  if (error) {
    return res.status(400).send({
      "errors": AuthValidator.formatErrorMessages(error.details)
    });
  }

  const user = await UsersService.findOneByAccountName(payload.account_name);

  if (user) {
    return res.status(400).send({
      'errors' : [
        {
          'field': 'account_name',
          'message': 'That account is taken. Try another.'
        }
      ]
    });
  }

  if (!EosJsEcc.isValidPublic(payload.public_key)) {
    return next(new AppError('Public key is not valid', 400));
  }

  let isSignValid;
  try {
    isSignValid = EosJsEcc.verify(payload.sign, payload.account_name, payload.public_key);

    if (!isSignValid) {
      return res.status(400).send({
        'errors' : [
          {
            'field': 'account_name',
            'message': 'Sign is not valid'
          }
        ]
      });
    }

    const doesAccountExists = await eosApi.doesAccountExist(payload.account_name);

    if(doesAccountExists) {
      return res.status(400).send({
        'errors' : [
          {
            'field': 'account_name',
            'message': 'That account is taken. Try another.'
          }
        ]
      });
    }

    // TODO #refactor - move to Repository behind the service
     const newUser = await models['Users'].create({
        account_name: payload.account_name,
        nickname: payload.account_name,
        created_at: new Date(),
        updated_at: new Date()
      });

    const token = AuthService.getNewJwtToken(newUser);

    // TODO register new user in blockchain
    // TODO save brainkey in database - MVP

    res.send({
      'token': token,
      'user': newUser
    });

  } catch (e) {
    return next(new AppError(e.message, 400));
  }
});

module.exports = router;