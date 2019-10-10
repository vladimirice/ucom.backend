"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const inversify_1 = require("inversify");
require("reflect-metadata");
const AuthValidator = require("../../auth/validators");
const AuthService = require("../../auth/authService");
const RegisterNewUserService = require("./registration/register-new-user-service");
let RegistrationService = class RegistrationService {
    // eslint-disable-next-line class-methods-use-this
    async processRegistration(body) {
        const requestData = await AuthValidator.checkRegistrationRequest(body);
        const isTrackingAllowed = !!body.is_tracking_allowed;
        const publicKeys = {
            owner: requestData.owner_public_key,
            active: requestData.active_public_key,
            social: requestData.social_public_key,
        };
        const user = await RegisterNewUserService.processRegistration(requestData.account_name, publicKeys, true, isTrackingAllowed);
        const token = AuthService.getNewJwtToken(user);
        return {
            token,
            user,
        };
    }
};
RegistrationService = __decorate([
    inversify_1.injectable()
], RegistrationService);
module.exports = RegistrationService;
