import { Request, Response } from 'express';
import { formDataParser } from '../../api/middleware/form-data-parser-middleware';

import LoginService = require('../service/login-service');

const express = require('express');
require('express-async-errors');

const router = express.Router();

router.post('/login', [formDataParser], async (request: Request, res: Response) => {
  const result = await LoginService.logInUser(request.body);

  return res.send(result);
});

export = router;
