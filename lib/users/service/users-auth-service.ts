import { inject, injectable } from "inversify";
import "reflect-metadata";
import { UsersDiTypes } from '../interfaces/di-interfaces';
import { IRequestBody } from '../../common/interfaces/common-types';
import { AffiliatesDiTypes } from '../../affiliates/interfaces/di-interfaces';
import { Request } from 'express';

@injectable()
class UsersAuthService {
  private registrationService;
  private registrationConversionService;

  public constructor(
    @inject(UsersDiTypes.registrationService) registrationService,
    @inject(AffiliatesDiTypes.registrationConversionService) registrationConversionService,
  ) {
    this.registrationService            = registrationService;
    this.registrationConversionService  = registrationConversionService;
  }

  public async processNewUserRegistration(request: Request) {
    const { body }: IRequestBody = request;

    const newUser = await this.registrationService.processRegistration(body);

    await this.registrationConversionService.processReferral(request);

    return newUser;
  }
}

export = UsersAuthService;
