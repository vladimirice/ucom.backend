"use strict";
const UsersModelProvider = require("../../users-model-provider");
const knex = require("../../../../config/knex");
const ProfileSerializer = require("./profile-serializer");
const UserActivityService = require("../../user-activity-service");
const moment = require("moment");
const EosApi = require("../../../eos/eosApi");
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const { ContentApi } = require('ucom-libs-wallet');
const USERS_TABLE_NAME = UsersModelProvider.getUsersTableName();
class ExistingProfilesProcessor {
    static async process(limit = 100) {
        EosApi.initBlockchainLibraries();
        const events = [
            EventsIds.userCreatesProfile(),
            EventsIds.userUpdatesProfile(),
        ];
        const userFieldsToSelect = ProfileSerializer.getUserFieldsToSave('u');
        const manyUsers = await knex(`${USERS_TABLE_NAME} AS u`)
            .select(userFieldsToSelect)
            .leftJoin(`${UsersModelProvider.getUsersActivityTableName()} AS a`, function () {
            this.on('a.user_id_from', '=', 'u.id')
                .andOnIn('a.event_id', events);
        })
            .whereNull('a.id')
            .limit(limit);
        let totalProcessedCounter = 0;
        let totalSkippedCounter = 0;
        for (const user of manyUsers) {
            const isSuccess = await this.processOneUser(user);
            if (isSuccess) {
                totalProcessedCounter += 1;
            }
            else {
                totalSkippedCounter += 1;
            }
        }
        return {
            totalProcessedCounter,
            totalSkippedCounter,
        };
    }
    static async processOneUser(user) {
        user.sources = await knex(UsersModelProvider.getUsersSourcesTableName())
            .select(ProfileSerializer.getUserSourcesFieldsToSave())
            .where('user_id', user.id);
        const privateKeyRow = await knex(USERS_TABLE_NAME)
            .select('private_key as privateKey')
            .where({
            id: user.id,
        })
            .first();
        const { privateKey } = privateKeyRow;
        let signedTransaction;
        try {
            signedTransaction = await ContentApi.updateProfile(user.account_name, privateKey, user);
        }
        catch (error) {
            console.error(user);
            console.error(error);
            return false;
        }
        const activity = await knex.transaction(async (trx) => {
            const queryBuilder = knex(USERS_TABLE_NAME)
                .update({
                profile_updated_at: moment().utc().format(),
                profile_updated_by: 2,
            })
                .where({
                id: user.id,
            });
            const [newActivity] = await Promise.all([
                UserActivityService.createForUserUpdatesProfileViaKnex(signedTransaction, user.id, trx),
                queryBuilder,
            ]);
            return newActivity;
        });
        await UserActivityService.sendPayloadToRabbitEosV2(activity);
        return true;
    }
}
module.exports = ExistingProfilesProcessor;
