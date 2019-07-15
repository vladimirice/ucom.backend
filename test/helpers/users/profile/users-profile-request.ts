import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import moment = require('moment');
import UserProfileRequest = require('../user-profile-request');

const { ContentApi } = require('ucom-libs-wallet');

class UsersProfileRequest {
  public static async sendProfileAfterRegistrationForUser(myself: UserModel): Promise<void> {
    const isTrackingAllowed = true;
    const userCreatedAt = moment().utc().format();

    const signedTransaction = await ContentApi.createProfileAfterRegistration(
      myself.account_name,
      myself.private_key,
      isTrackingAllowed,
      userCreatedAt,
    );

    await UserProfileRequest.sendNewProfileTransaction(
      myself,
      signedTransaction,
    );
  }
}

export = UsersProfileRequest;
