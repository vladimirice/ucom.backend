"use strict";
const form_data_parser_middleware_1 = require("../../api/middleware/form-data-parser-middleware");
const LoginService = require("../service/login-service");
const AuthValidator = require("../../auth/validators");
const express = require('express');
require('express-async-errors');
const router = express.Router();
router.post('/login', [form_data_parser_middleware_1.formDataParser], async (request, res) => {
    const result = await LoginService.logInUser(request.body);
    return res.send(result);
});
router.post('/validate-account-name', [form_data_parser_middleware_1.formDataParser], async (req, res) => {
    const { account_name } = req.body;
    AuthValidator.validateAccountNameSyntax(account_name);
    await AuthValidator.accountNameExistsInBlockchain(account_name);
    res.send({
        status: 'ok',
    });
});
module.exports = router;
