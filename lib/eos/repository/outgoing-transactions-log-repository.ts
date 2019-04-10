import { Transaction } from 'knex';

import BlockchainModelProvider = require('../service/blockchain-model-provider');
import knex = require('../../../config/knex');

const TABLE_NAME = BlockchainModelProvider.outgoingTransactionsLogTableName();

class OutgoingTransactionsLogRepository {
  public static async insertOneRow(
    trId: string,
    signedPayload: any,
    pushingResponse: any,
    status: number,
    trx: Transaction,
  ): Promise<void> {
    await trx(TABLE_NAME)
      .insert({
        status,
        tr_id: trId,
        signed_payload: signedPayload,
        pushing_response: pushingResponse,
      });
  }

  public static async findAll(): Promise<any> {
    return knex(TABLE_NAME);
  }
}

export = OutgoingTransactionsLogRepository;
