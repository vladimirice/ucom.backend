import OffersModel = require('../models/offers-model');
import knex = require('../../../config/knex');
import ClicksModel = require('../models/clicks-model');
import AffiliatesAttributionIdsDictionary = require('../dictionary/affiliates-attribution-ids-dictionary');
import StreamsModel = require('../models/streams-model');

class ClicksRepository {
  public static async getAccountNameByAttributionModel(
    offer: OffersModel,
    uniqueId: string,
  ): Promise<string | null> {
    const subquery = knex(ClicksModel.getTableName())
      .select('stream_id')
      .where({
        offer_id: offer.id,
        user_unique_id: uniqueId,
      })
      .limit(1);

    if (AffiliatesAttributionIdsDictionary.isLastWins(offer)) {
      subquery.orderBy('id', 'DESC');
    } else {
      subquery.orderBy('id', 'ASC');
    }

    const first = await knex(StreamsModel.getTableName())
      .select('account_name')
      .where('id', '=', subquery)
      .first();

    return first ? first.account_name : null;
  }
}

export = ClicksRepository;
