import { injectable } from 'inversify';
import 'reflect-metadata';

import { IRequestBody } from '../../common/interfaces/common-types';
import { UserModel } from '../interfaces/model-interfaces';

import AuthValidator = require('../../auth/validators');
import AuthService = require('../../auth/authService');
import RegisterNewUserService = require('./registration/register-new-user-service');

@injectable()
class RegistrationService {
  // eslint-disable-next-line class-methods-use-this
  public async processRegistration(body: IRequestBody): Promise<{ token: string, user: UserModel }> {
    const requestData = await AuthValidator.checkRegistrationRequest(body);

    const isTrackingAllowed = !!body.is_tracking_allowed;

    const publicKeys = {
      owner: requestData.owner_public_key,
      active: requestData.active_public_key,
      social: requestData.social_public_key,
    };

    const user = await RegisterNewUserService.processRegistration(
      requestData.account_name,
      publicKeys,
      true,
      isTrackingAllowed,
    );

    const token = AuthService.getNewJwtToken(user);

    return {
      token,
      user,
    };
  }
}

export = RegistrationService;
