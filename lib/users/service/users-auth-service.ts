import { inject, injectable } from "inversify";
import "reflect-metadata";
import { IAuthService, IRegistrationService, UsersDiTypes } from '../interfaces/di-interfaces';
import { IRequestBody } from '../../common/interfaces/common-types';

@injectable()
class UsersAuthService implements IAuthService {
  private registrationService: IRegistrationService;

  public constructor(
    @inject(UsersDiTypes.registrationService) registrationService: IRegistrationService,
  ) {
    this.registrationService = registrationService;
  }

  public async processNewUserRegistration(body: IRequestBody) {
    return this.registrationService.processRegistration(body);
  }
}

export = UsersAuthService;
