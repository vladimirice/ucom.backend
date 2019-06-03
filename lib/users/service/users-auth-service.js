"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
const inversify_1 = require("inversify");
require("reflect-metadata");
const di_interfaces_1 = require("../interfaces/di-interfaces");
const di_interfaces_2 = require("../../affiliates/interfaces/di-interfaces");
const UnprocessableEntityError = require("../../affiliates/errors/unprocessable-entity-error");
let UsersAuthService = class UsersAuthService {
    constructor(registrationService, registrationConversionService) {
        this.registrationService = registrationService;
        this.registrationConversionService = registrationConversionService;
    }
    async processNewUserRegistration(request) {
        const { body } = request;
        const { token, user } = await this.registrationService.processRegistration(body);
        try {
            await this.registrationConversionService.processReferral(request, user);
            return {
                token,
                user,
                affiliates_action: {
                    success: true,
                }
            };
        }
        catch (error) {
            if (!(error instanceof UnprocessableEntityError)) {
                throw error;
            }
            return {
                token,
                user,
            };
        }
    }
};
UsersAuthService = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(di_interfaces_1.UsersDiTypes.registrationService)),
    __param(1, inversify_1.inject(di_interfaces_2.AffiliatesDiTypes.registrationConversionService)),
    __metadata("design:paramtypes", [Object, Object])
], UsersAuthService);
module.exports = UsersAuthService;
