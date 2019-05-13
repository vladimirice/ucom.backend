"use strict";
const express = require('express');
require('express-async-errors');
const router = express.Router();
const authValidator = require('../../lib/auth/validators');
const usersAuthService = require('../../lib/users/service/users-auth-service');
const { formDataParser } = require('../../lib/api/middleware/form-data-parser-middleware');
/* Register new user */
router.post('/', [formDataParser], async (req, res) => {
    const response = await usersAuthService.processNewUserRegistration(req.body);
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
module.exports = router;
