/* eslint-disable no-console */
import { TotalParametersResponse } from '../../../common/interfaces/response-interfaces';
import { IActivityModel } from '../../interfaces/users-activity/dto-interfaces';

import UsersModelProvider = require('../../users-model-provider');
import knex = require('../../../../config/knex');
import ProfileSerializer = require('./profile-serializer');
import UserActivityService = require('../../user-activity-service');
import moment = require('moment');
import EosApi = require('../../../eos/eosApi');

const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const { ContentApi } = require('ucom-libs-wallet');

const USERS_TABLE_NAME = UsersModelProvider.getUsersTableName();

class ExistingProfilesProcessor {
  public static async process(limit: number = 100): Promise<TotalParametersResponse> {
    EosApi.initBlockchainLibraries();

    const events: number[] = [
      EventsIds.userCreatesProfile(),
      EventsIds.userUpdatesProfile(),
    ];

    const userFieldsToSelect: string[] = ProfileSerializer.getUserFieldsToSave('u');

    const manyUsers: any[] = await knex(`${USERS_TABLE_NAME} AS u`)
      .select(userFieldsToSelect)
      .leftJoin(`${UsersModelProvider.getUsersActivityTableName()} AS a`, function () {
        this.on('a.user_id_from', '=', 'u.id')
          .andOnIn('a.event_id', events);
      })
      .whereNull('a.id')
      .limit(limit)
    ;

    let totalProcessedCounter = 0;
    let totalSkippedCounter = 0;

    for (const user of manyUsers) {
      const isSuccess = await this.processOneUser(user);

      if (isSuccess) {
        totalProcessedCounter += 1;
      } else {
        totalSkippedCounter += 1;
      }
    }

    return {
      totalProcessedCounter,
      totalSkippedCounter,
    };
  }

  private static async processOneUser(user: any) {
    user.sources = await knex(UsersModelProvider.getUsersSourcesTableName())
      .select(ProfileSerializer.getUserSourcesFieldsToSave())
      .where('user_id', user.id);

    const privateKeyRow: { privateKey: string } = await knex(USERS_TABLE_NAME)
      .select('private_key as privateKey')
      .where({
        id: user.id,
      })
      .first();

    const { privateKey } = privateKeyRow;

    let signedTransaction: string;

    try {
      signedTransaction = await ContentApi.updateProfile(user.account_name, privateKey, user);
    } catch (error) {
      console.error(user);
      console.error(error);

      return false;
    }

    const activity: IActivityModel = await knex.transaction(async (trx) => {
      const queryBuilder = knex(USERS_TABLE_NAME)
        .update({
          profile_updated_at: moment().utc().format(),
          profile_updated_by: 2,
        })
        .where({
          id: user.id,
        });

      const [newActivity] = await Promise.all([
        UserActivityService.createForUserCreatesProfile(signedTransaction, user.id, trx),
        queryBuilder,
      ]);

      return newActivity;
    });

    await UserActivityService.sendPayloadToRabbitEosV2(activity);

    return true;
  }
}

export = ExistingProfilesProcessor;
