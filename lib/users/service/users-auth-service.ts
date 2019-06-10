import { inject, injectable } from "inversify";
import "reflect-metadata";
import { UsersDiTypes } from '../interfaces/di-interfaces';
import { IRequestBody } from '../../common/interfaces/common-types';
import { Request } from 'express';
import RegistrationService = require('./registration-service');

@injectable()
class UsersAuthService {
  private registrationService: RegistrationService;

  public constructor(
    @inject(UsersDiTypes.registrationService) registrationService,
  ) {
    this.registrationService            = registrationService;
  }

  public async processNewUserRegistration(request: Request) {
    const { body }: IRequestBody = request;

    return  this.registrationService.processRegistration(body);
  }
}

export = UsersAuthService;
