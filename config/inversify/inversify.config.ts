import { Container } from "inversify";
import { UsersDiTypes } from '../../lib/users/interfaces/di-interfaces';
import UsersAuthService = require('../../lib/users/service/users-auth-service');
import RegistrationService = require('../../lib/users/service/registration-service');
import { AffiliatesDiTypes } from '../../lib/affiliates/interfaces/di-interfaces';
import RegistrationConversionService = require('../../lib/affiliates/service/conversions/registration-conversion-service');

const diContainer = new Container();
diContainer.bind(UsersDiTypes.authService).to(UsersAuthService);
diContainer.bind(UsersDiTypes.registrationService).to(RegistrationService);
diContainer.bind(AffiliatesDiTypes.registrationConversionService).to(RegistrationConversionService);

export { diContainer };
