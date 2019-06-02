"use strict";
const di_interfaces_1 = require("../../lib/users/interfaces/di-interfaces");
const express = require('express');
require('express-async-errors');
const router = express.Router();
const authValidator = require('../../lib/auth/validators');
const { formDataParser } = require('../../lib/api/middleware/form-data-parser-middleware');
/* Register new user */
router.post('/', [formDataParser], async (req, res) => {
    const service = req.container.get(di_interfaces_1.UsersDiTypes.authService);
    const response = await service.processNewUserRegistration(req.body);
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
