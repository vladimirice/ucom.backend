import { Transaction } from 'knex';

const AIRDROPS_TABLE_NAME = 'airdrops';

const {AirdropStatuses} = require('ucom.libs.common').Airdrop.Dictionary;

class AirdropsCreatorRepository {
  public static async createNewAirdrop(
    title: string,
    postId: number,
    conditions: any,
    trx: Transaction,
  ): Promise<number> {
    const res = await trx(AIRDROPS_TABLE_NAME).insert({
      title,
      status: AirdropStatuses.NEW,
      post_id: postId,
      conditions: JSON.stringify(conditions),
    }).returning(['id']);

    return +res[0].id;
  }
}

export = AirdropsCreatorRepository;
