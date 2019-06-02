import { Container } from "inversify";
import { IRegistrationService, UsersDiTypes } from '../../lib/users/interfaces/di-interfaces';
import UsersAuthService = require('../../lib/users/service/users-auth-service');
import RegistrationService = require('../../lib/users/service/registration-service');

const diContainer = new Container();
diContainer.bind(UsersDiTypes.authService).to(UsersAuthService);
diContainer.bind<IRegistrationService>(UsersDiTypes.registrationService).to(RegistrationService);

export { diContainer };
