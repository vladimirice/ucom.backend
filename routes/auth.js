"use strict";
const express = require('express');
require('express-async-errors');
const router = express.Router();
const _ = require('lodash');
const eosJsEcc = require('../lib/crypto/eosjs-ecc');
const { AppError } = require('../lib/api/errors');
const authValidator = require('../lib/auth/validators');
const authService = require('../lib/auth/authService');
const usersService = require('../lib/users/users-service');
const { formDataParser } = require('../lib/api/middleware/form-data-parser-middleware');
// eslint-disable-next-line consistent-return
router.post('/login', [formDataParser], async (req, res, next) => {
    // Public key is not required here
    const payload = _.pick(req.body, ['account_name', 'public_key', 'sign']);
    const { error } = authValidator.validateLogin(req.body);
    if (error) {
        return res.status(400).send({
            errors: authValidator.formatErrorMessages(error.details),
        });
    }
    const user = await usersService.findOneByAccountName(payload.account_name);
    if (!user) {
        return res.status(400).send({
            errors: [
                {
                    field: 'account_name',
                    message: 'Incorrect Brainkey or Account name',
                },
            ],
        });
    }
    // Not required for login
    if (!eosJsEcc.isValidPublic(payload.public_key)) {
        return next(new AppError('Public key is not valid', 400));
    }
    let isSignValid;
    try {
        isSignValid = eosJsEcc.verify(payload.sign, payload.account_name, user.public_key);
        if (!isSignValid) {
            return res.status(400).send({
                errors: [
                    {
                        field: 'account_name',
                        message: 'Incorrect Brainkey or Account name',
                    },
                ],
            });
        }
        const token = authService.getNewJwtToken(user);
        res.send({
            token,
            user,
            success: true,
        });
    }
    catch (error_) {
        return next(new AppError(error_.message, 400));
    }
});
module.exports = router;
