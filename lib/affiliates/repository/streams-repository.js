"use strict";
const StreamsModel = require("../models/streams-model");
const knex = require("../../../config/knex");
class StreamsRepository {
    static async getRedirectUrl(offer, userId) {
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
module.exports = StreamsRepository;
