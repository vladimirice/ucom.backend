import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import UsersHelper = require('../../integration/helpers/users-helper');

class SampleUsersProvider {
  // const [userVlad, userJane, userPetr, userRokky] = await SampleUsersProvider.getAll();
  public static async getAll(): Promise<[UserModel, UserModel, UserModel, UserModel]> {
    return Promise.all([
      UsersHelper.getUserVlad(),
      UsersHelper.getUserJane(),
      UsersHelper.getUserPetr(),
      UsersHelper.getUserRokky(),
    ]);
  }
}

export = SampleUsersProvider;
