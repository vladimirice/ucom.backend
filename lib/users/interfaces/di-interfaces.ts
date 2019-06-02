import { IRequestBody } from '../../common/interfaces/common-types';

const UsersDiTypes = {
  registrationService:  Symbol.for('registrationService'),
  authService:          Symbol.for('authService'),
};

interface IRegistrationService {
  processRegistration(body: IRequestBody): void
}

interface IAuthService {
}

export {
  UsersDiTypes,
  IRegistrationService,
  IAuthService,
}
