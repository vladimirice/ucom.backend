"use strict";
const AIRDROPS_TABLE_NAME = 'airdrops';
const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;
class AirdropsCreatorRepository {
  static async createNewAirdrop(title, postId, conditions, startedAt, finishedAt, trx) {
        const res = await trx(AIRDROPS_TABLE_NAME).insert({
            title,
            status: AirdropStatuses.NEW,
            post_id: postId,
            conditions: JSON.stringify(conditions),
          started_at: startedAt,
          finished_at: finishedAt,
        }).returning(['id']);
        return +res[0].id;
    }
}
module.exports = AirdropsCreatorRepository;
