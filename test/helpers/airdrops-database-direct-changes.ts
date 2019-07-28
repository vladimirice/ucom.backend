import { UserModel } from '../../lib/users/interfaces/model-interfaces';
import { IAirdrop } from '../../lib/airdrops/interfaces/model-interfaces';

import AirdropsModelProvider = require('../../lib/airdrops/service/airdrops-model-provider');
import knex = require('../../config/knex');
import UsersExternalRepository = require('../../lib/users-external/repository/users-external-repository');
import moment = require('moment');
import DatetimeHelper = require('../../lib/common/helper/datetime-helper');

class AirdropsDatabaseDirectChanges {
  public static async setAirdropStatusReceived(user: UserModel): Promise<void> {
    const externalUser = await UsersExternalRepository.findGithubUserExternalByUserId(user.id);

    await knex(AirdropsModelProvider.airdropsUsersExternalDataTableName())
      .update({
        status: 3,
      })
      .where('users_external_id', externalUser!.id);
  }

  public static async setAirdropInProcess(airdrop: IAirdrop) {
    const startedAt = DatetimeHelper.getMomentInUtcString(moment().subtract(2, 'days'));
    const finishedAt = DatetimeHelper.getMomentInUtcString(moment().add(14, 'days'));

    await knex(AirdropsModelProvider.airdropsTableName())
      .update({
        started_at: startedAt,
        finished_at: finishedAt,
      })
      .where('id', airdrop.id);
  }

  public static async setAirdropIsFinished(airdrop: IAirdrop) {
    const startedAt = DatetimeHelper.getMomentInUtcString(moment().subtract(10, 'days'));
    const finishedAt = DatetimeHelper.getMomentInUtcString(moment().add(5, 'days'));

    await knex(AirdropsModelProvider.airdropsTableName())
      .update({
        started_at: startedAt,
        finished_at: finishedAt,
      })
      .where('id', airdrop.id);
  }
}

export = AirdropsDatabaseDirectChanges;
