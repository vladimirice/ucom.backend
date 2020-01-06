import { TotalParametersResponse } from '../../common/interfaces/response-interfaces';

import UsersModelProvider = require('../../users/users-model-provider');
import knex = require('../../../config/knex');
import StreamsModel = require('../models/streams-model');
import OffersModel = require('../models/offers-model');

const config = require('config');

class StreamsCreatorService {
  public static async createRegistrationStreamsForEverybody(offer: OffersModel): Promise<TotalParametersResponse> {
    const withoutStreams: {id: number, account_name: string}[] =
      await knex(`${UsersModelProvider.getTableName()} AS u`)
        .select(['u.id', 'u.account_name'])
        // eslint-disable-next-line func-names
        .leftJoin(`${StreamsModel.getTableName()} AS s`, function () {
          this
            .on('s.user_id', '=', 'u.id')
            .andOn('s.offer_id', '=', offer.id);
        })
        .whereNull('s.id');

    let totalProcessedCounter = 0;
    for (const oneUser of withoutStreams) {
      // it is supposed that there are small amount of users after the first run.
      // #task - implement batches in the future
      await StreamsModel.query().insert({
        user_id:      oneUser.id,
        account_name: oneUser.account_name,
        offer_id:     offer.id,
        landing_url: `${config.servers.frontend}/ambassador/${oneUser.account_name}`,
        redirect_url: offer.redirect_url_template.replace('{account_name}', oneUser.account_name),
      });

      totalProcessedCounter += 1;
    }

    return {
      totalProcessedCounter,
      totalSkippedCounter: 0,
    };
  }
}

export = StreamsCreatorService;
