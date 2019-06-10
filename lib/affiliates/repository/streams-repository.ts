import OffersModel = require('../models/offers-model');
import StreamsModel = require('../models/streams-model');
import knex = require('../../../config/knex');

class StreamsRepository {
  public static async getRedirectUrl(offer: OffersModel, userId: number): Promise<string | null> {
    const data = await knex(StreamsModel.getTableName())
      .select('redirect_url')
      .where({
        offer_id: offer.id,
        user_id: userId,
      })
      .first();

    return data ? data.redirect_url : null;
  }
}

export = StreamsRepository;
