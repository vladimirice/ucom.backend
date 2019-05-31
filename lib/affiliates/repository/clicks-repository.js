"use strict";
const knex = require("../../../config/knex");
const ClicksModel = require("../models/clicks-model");
const AffiliatesAttributionIdsDictionary = require("../dictionary/affiliates-attribution-ids-dictionary");
const StreamsModel = require("../models/streams-model");
class ClicksRepository {
    static async getAccountNameByAttributionModel(offer, uniqueId) {
        const subquery = knex(ClicksModel.getTableName())
            .select('stream_id')
            .where({
            offer_id: offer.id,
            user_unique_id: uniqueId,
        })
            .limit(1);
        if (AffiliatesAttributionIdsDictionary.isLastWins(offer)) {
            subquery.orderBy('id', 'DESC');
        }
        else {
            subquery.orderBy('id', 'ASC');
        }
        const first = await knex(StreamsModel.getTableName())
            .select('account_name')
            .where('id', '=', subquery)
            .first();
        return first ? first.account_name : null;
    }
}
module.exports = ClicksRepository;
