"use strict";
const ConversionsModel = require("../models/conversions-model");
const knex = require("../../../config/knex");
const UsersModelProvider = require("../../users/users-model-provider");
const EosBlockchainStatusDictionary = require("../../eos/eos-blockchain-status-dictionary");
const ProcessStatusesDictionary = require("../../common/dictionary/process-statuses-dictionary");
const StreamsModel = require("../models/streams-model");
const NumbersHelper = require("../../common/helper/numbers-helper");
class ConversionsRepository {
    static async findSentToBlockchainToProcess() {
        const data = await knex(`${ConversionsModel.getTableName()} as t`)
            .select([
            't.id AS conversion_id',
            't.user_id AS referral_user_id',
            's.user_id AS source_user_id',
        ])
            .innerJoin(`${StreamsModel.getTableName()} AS s`, 's.id', 't.stream_id')
            // eslint-disable-next-line func-names
            .innerJoin(`${UsersModelProvider.getUsersActivityTableName()} AS a`, function () {
            this.on('a.id', '=', 't.users_activity_id')
                .andOn('a.blockchain_status', '=', EosBlockchainStatusDictionary.getStatusIsSent())
                .andOn('t.status', '=', ProcessStatusesDictionary.new());
        });
        for (const item of data) {
            item.conversion_id = NumbersHelper.processFieldToBeNumeric(item.conversion_id, 'conversion_id');
        }
        return data;
    }
    static async setStatusSuccessById(conversionId, transaction) {
        await transaction(ConversionsModel.getTableName())
            .update({
            status: ProcessStatusesDictionary.success(),
        })
            .where({
            id: conversionId,
        });
    }
    static async setStatusDuplicateById(conversionId) {
        await knex(ConversionsModel.getTableName())
            .update({
            status: ProcessStatusesDictionary.duplicate(),
        })
            .where({
            id: conversionId,
        });
    }
}
module.exports = ConversionsRepository;
