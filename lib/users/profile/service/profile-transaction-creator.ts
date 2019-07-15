import { Request } from 'express';
import _ from 'lodash';
import { UserModel } from '../../interfaces/model-interfaces';
import { BadRequestError } from '../../../api/errors';

import UserActivityService = require('../../user-activity-service');

class ProfileTransactionCreator {
  public static async createRegistrationProfileTransaction(
    request: Request,
    // @ts-ignore
    currentUser: UserModel,
  ): Promise<void> {
    const { body } = request;

    if (_.isEmpty(body) || !body.signed_transaction) {
      throw new BadRequestError('It is required to provide a signed_transaction');
    }

    const activity = await UserActivityService.createForUserCreatesProfile(body.signed_transaction, currentUser.id);

    await UserActivityService.sendPayloadToRabbitEosV2(activity);
  }
}

export = ProfileTransactionCreator;
