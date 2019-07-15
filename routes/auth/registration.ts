import { UsersDiTypes } from '../../lib/users/interfaces/di-interfaces';

import UsersAuthService = require('../../lib/users/service/users-auth-service');

const express = require('express');
require('express-async-errors');

const router  = express.Router();
const authValidator = require('../../lib/auth/validators');

const { formDataParser } = require('../../lib/api/middleware/form-data-parser-middleware');

/* Register new user */
router.post('/', [formDataParser], async (req, res) => {
  const service: UsersAuthService = req.container.get(UsersDiTypes.authService);

  const response = await service.processNewUserRegistration(req);

  return res.status(201).send(response);
});

/* Check is account_name valid */
router.post('/validate-account-name', [formDataParser], async (req, res) => {
  const { account_name } = req.body;
  await authValidator.validateNewAccountName(account_name);

  res.send({
    status: 'ok',
  });
});

export = router;
