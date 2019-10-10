import { Request, Response } from 'express';
import { formDataParser } from '../../api/middleware/form-data-parser-middleware';

import LoginService = require('../service/login-service');
import AuthValidator = require('../../auth/validators');

const express = require('express');
require('express-async-errors');

const router = express.Router();

router.post('/login', [formDataParser], async (request: Request, res: Response) => {
  const result = await LoginService.logInUser(request.body);

  return res.send(result);
});

router.post('/validate-account-name', [formDataParser], async (req, res) => {
  const { account_name } = req.body;

  AuthValidator.validateAccountNameSyntax(account_name);
  await AuthValidator.accountNameExistsInBlockchain(account_name);

  res.send({
    status: 'ok',
  });
});


export = router;
