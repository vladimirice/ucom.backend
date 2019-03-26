import { Transaction } from 'knex';

const AIRDROPS_TABLE_NAME = 'airdrops';

const { AirdropStatuses } = require('ucom.libs.common').Airdrop.Dictionary;

class AirdropsCreatorRepository {
  public static async createNewAirdrop(
    title: string,
    postId: number,
    conditions: any,
    startedAt: string,
    finishedAt: string,
    trx: Transaction,
  ): Promise<number> {
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

export = AirdropsCreatorRepository;
