"use strict";
const AIRDROPS_TABLE_NAME = 'airdrops';
const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;
class AirdropsCreatorRepository {
    static async createNewAirdrop(title, postId, conditions, trx) {
        const res = await trx(AIRDROPS_TABLE_NAME).insert({
            title,
            status: AirdropStatuses.NEW,
            post_id: postId,
            conditions: JSON.stringify(conditions),
        }).returning(['id']);
        return +res[0].id;
    }
}
module.exports = AirdropsCreatorRepository;
