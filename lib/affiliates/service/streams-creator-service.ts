import UsersModelProvider = require('../../users/users-model-provider');
import knex = require('../../../config/knex');
import StreamsModel = require('../models/streams-model');
import OffersModel = require('../models/offers-model');

class StreamsCreatorService {
  public static async createRegistrationStreamsForEverybody(offer: OffersModel) {
    const withoutStreams: {id: number, account_name: string}[] =
      await knex(`${UsersModelProvider.getTableName()} AS u`)
      .select(['u.id', 'u.account_name'])
      .leftJoin(`${StreamsModel.getTableName()} AS s`, function() {
        this
          .on('s.user_id', '=', 'u.id')
          .andOn('s.offer_id', '=', offer.id);
      })
      .whereNull('s.id');

    for (const oneUser of withoutStreams) {
      // it is supposed that there are small amount of users after the first run.
      // #task - implement batches in the future
      await StreamsModel.query().insert({
        user_id:      oneUser.id,
        account_name: oneUser.account_name,
        offer_id:     offer.id,
      });
    }
  }
}

export = StreamsCreatorService;
