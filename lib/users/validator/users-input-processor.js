"use strict";
const users_validator_1 = require("../../validator/users-validator");
const errors_1 = require("../../api/errors");
const UserInputSanitizer = require("../../api/sanitizers/user-input-sanitizer");
const UsersModelProvider = require("../users-model-provider");
const joi = require('joi');
class UsersInputProcessor {
    static processWithValidation(body) {
        this.process(body);
        return this.getValidated(body);
    }
    static getValidated(body) {
        const { error, value: requestData } = joi.validate(body, users_validator_1.UsersUpdatingSchema, {
            allowUnknown: true,
            stripUnknown: true,
            abortEarly: false,
        });
        if (error) {
            throw new errors_1.JoiBadRequestError(error);
        }
        return requestData;
    }
    static process(body) {
        UserInputSanitizer.sanitizeInputWithModelProvider(body, UsersModelProvider.getUsersRelatedFieldsSet());
    }
}
module.exports = UsersInputProcessor;
