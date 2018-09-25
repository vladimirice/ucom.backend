const express = require('express');
const router  = express.Router();
const _ = require('lodash');
const EosJsEcc = require('../../lib/crypto/eosjs-ecc');
const {AppError} = require('../../lib/api/errors');
const AuthValidator = require('../../lib/auth/validators');
const AuthService = require('../../lib/auth/authService');
const models = require('../../models');
const EosAuth = require('../../lib/eos/eos-auth');
const UserService = require('../../lib/users/users-service');
const multer = require('multer');
const upload = multer();

/* Register new user */
router.post('/', [ upload.array() ], async function (req, res, next) {
  const payload = _.pick(req.body, ['account_name', 'public_key', 'sign', 'brainkey']);

  const { error } = AuthValidator.validateRegistration(req.body);
  if (error) {
    return res.status(400).send({
      "errors": AuthValidator.formatErrorMessages(error.details)
    });
  }

  try {
    await AuthValidator.validateNewAccountName(payload.account_name);
  } catch (err) {
    return res.status(400).send({
      'errors': {
        'account_name': err.message
      }
    });
  }

  if (!EosJsEcc.isValidPublic(payload.public_key)) {
    return next(new AppError('Public key is not valid', 400));
  }

  try {
    if (!EosJsEcc.verify(payload.sign, payload.account_name, payload.public_key)) {
      return res.status(400).send({
        'errors' : [
          {
            'field': 'account_name',
            'message': 'Sign is not valid'
          }
        ]
      });
    }

    // TODO #refactor - move to Repository behind the service
     const newUser = await models['Users'].create({
        account_name: payload.account_name,
        nickname: payload.account_name,
        created_at: new Date(),
        updated_at: new Date(),
        public_key: payload.public_key,
        private_key: EosAuth.getActivePrivateKeyByBrainkey(payload.brainkey),
        owner_public_key: EosAuth.getOwnerPublicKeyByBrainKey(payload.brainkey)
      });

    const token = AuthService.getNewJwtToken(newUser);

    try {
      if (process.env.NODE_ENV === 'production') {
        await EosAuth.createAccount(newUser.account_name, newUser.owner_public_key, newUser.public_key);
        await UserService.setBlockchainRegistrationIsSent(newUser);

      } else {
        console.log('User blockchain creation is disabled for env: ', process.env.NODE_ENV);
      }
    } catch (err) {
      // TODO #log
      console.log(err);
    }

    res.send({
      'token': token,
      'user': newUser
    });

  } catch (e) {
    return next(new AppError(e.message, 400));
  }
});

/* Check is account_name valid */
router.post('/validate-account-name', async function (req, res) {
  const account_name = req.body['account_name'];

  try {
    await AuthValidator.validateNewAccountName(account_name);
  } catch (err) {
    return res.status(400).send({
      'errors': {
        'account_name': err.message
      }
    });
  }
  res.send({
    status: 'ok'
  })
});


module.exports = router;