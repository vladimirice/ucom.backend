import { inject, injectable } from "inversify";
import "reflect-metadata";
import { UsersDiTypes } from '../interfaces/di-interfaces';
import { IRequestBody } from '../../common/interfaces/common-types';
import { AffiliatesDiTypes } from '../../affiliates/interfaces/di-interfaces';
import { Request } from 'express';
import RegistrationService = require('./registration-service');
import RegistrationConversionService = require('../../affiliates/service/conversions/registration-conversion-service');
import UnprocessableEntityError = require('../../affiliates/errors/unprocessable-entity-error');

@injectable()
class UsersAuthService {
  private registrationService: RegistrationService;
  private registrationConversionService: RegistrationConversionService;

  public constructor(
    @inject(UsersDiTypes.registrationService) registrationService,
    @inject(AffiliatesDiTypes.registrationConversionService) registrationConversionService,
  ) {
    this.registrationService            = registrationService;
    this.registrationConversionService  = registrationConversionService;
  }

  public async processNewUserRegistration(request: Request) {
    const { body }: IRequestBody = request;
    const { token, user } = await this.registrationService.processRegistration(body);

    try {
      await this.registrationConversionService.processReferral(request, user);

      return {
        token,
        user,
        affiliates_action: { // just a simple indicator for the frontend
          success: true,
        }
      };
    } catch (error) {
      if (!(error instanceof UnprocessableEntityError)) {
        throw error;
      }

      return {
        token,
        user,
      }
    }
  }
}

export = UsersAuthService;
