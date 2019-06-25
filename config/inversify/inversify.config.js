"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const di_interfaces_1 = require("../../lib/users/interfaces/di-interfaces");
const di_interfaces_2 = require("../../lib/affiliates/interfaces/di-interfaces");
const UsersAuthService = require("../../lib/users/service/users-auth-service");
const RegistrationService = require("../../lib/users/service/registration-service");
const RegistrationConversionService = require("../../lib/affiliates/service/conversions/registration-conversion-service");
const EnvHelper = require("../../lib/common/helper/env-helper");
const diContainer = new inversify_1.Container();
exports.diContainer = diContainer;
// #task - move to the separate file close to the service like initBlockchainTraces
diContainer.bind(di_interfaces_1.UsersDiTypes.authService).to(UsersAuthService);
diContainer.bind(di_interfaces_1.UsersDiTypes.registrationService).to(RegistrationService);
diContainer.bind(di_interfaces_2.AffiliatesDiTypes.registrationConversionService).to(RegistrationConversionService);
if (EnvHelper.isTestEnv()) {
    const { initBlockchainTraces } = require('../../lib/blockchain-traces/inversify/blockchain-traces.inversify.config');
    initBlockchainTraces(diContainer);
}
