"use strict";
const BlockchainModelProvider = require("../service/blockchain-model-provider");
const knex = require("../../../config/knex");
const RepositoryHelper = require("../../common/repository/repository-helper");
const TABLE_NAME = BlockchainModelProvider.outgoingTransactionsLogTableName();
class OutgoingTransactionsLogRepository {
    static async insertOneRow(trId, signedPayload, pushingResponse, status) {
        const data = await knex(TABLE_NAME)
            .insert({
            status,
            tr_id: trId,
            signed_payload: signedPayload,
            pushing_response: pushingResponse,
        })
            .returning(['id']);
        return RepositoryHelper.getKnexOneIdReturningOrException(data);
    }
    static async findAll() {
        return knex(TABLE_NAME);
    }
}
module.exports = OutgoingTransactionsLogRepository;
