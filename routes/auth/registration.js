const express = require('express');
const router  = express.Router();
const AuthValidator = require('../../lib/auth/validators');

const UsersAuthService = require('../../lib/users/service/users-auth-service');
const { formDataParser } = require('../../lib/api/middleware/form-data-parser-middleware');

/* Register new user */
router.post('/', [ formDataParser ], async function (req, res) {
  const response = await UsersAuthService.processNewUserRegistration(req.body);

  return res.status(201).send(response);
});

/* Check is account_name valid */
router.post('/validate-account-name', [ formDataParser ], async function (req, res) {
  const account_name = req.body.account_name;
  await AuthValidator.validateNewAccountName(account_name);

  res.send({
    status: 'ok'
  })
});


module.exports = router;