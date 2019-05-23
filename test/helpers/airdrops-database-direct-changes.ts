import AirdropsModelProvider = require('../../lib/airdrops/service/airdrops-model-provider');
import knex = require('../../config/knex');
import UsersExternalRepository = require('../../lib/users-external/repository/users-external-repository');
import { UserModel } from '../../lib/users/interfaces/model-interfaces';

class AirdropsDatabaseDirectChanges {
  public static async setAirdropStatusReceived(user: UserModel): Promise<void> {
    const externalUser = await UsersExternalRepository.findGithubUserExternalByUserId(user.id);

    await knex(AirdropsModelProvider.airdropsUsersExternalDataTableName())
      .update({
        status: 3,
      })
      .where('users_external_id', externalUser!.id)
  }
}

export = AirdropsDatabaseDirectChanges;
