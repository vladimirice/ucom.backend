"use strict";
/* eslint-disable no-console */
const ucom_libs_common_1 = require("ucom.libs.common");
const EosApi = require("../../../eos/eosApi");
const knex = require("../../../../config/knex");
const PostsModelProvider = require("../posts-model-provider");
const UsersModelProvider = require("../../../users/users-model-provider");
const { PublicationsApi } = require('ucom-libs-wallet').Content;
const { EosClient, WalletApi } = require('ucom-libs-wallet');
const moment = require('moment');
class RepostResendingService {
    static async resendReposts(createdAtLessOrEqualThan, limit, printPushResponse = false, offset = 0) {
        EosApi.initBlockchainLibraries();
        const stateBefore = await WalletApi.getAccountState(EosApi.getHistoricalSenderAccountName());
        console.log(`Account sources: ${EosApi.getHistoricalSenderAccountName()}`);
        console.dir(stateBefore.resources);
        const manyPosts = await this.getManyReposts(createdAtLessOrEqualThan, limit, offset);
        await this.resendPostsOneByOne(manyPosts, printPushResponse);
        return {
            totalProcessedCounter: manyPosts.length,
            totalSkippedCounter: 0,
        };
    }
    static getManyReposts(createdAtLessOrEqualThan, limit, offset) {
        return knex(`${PostsModelProvider.getTableName()} AS p`)
            .select([
            'p.blockchain_id as blockchain_id',
            'p.description as description',
            'p.entity_images AS entity_images',
            knex.raw("COALESCE(p.entity_tags, '{}'::text[]) AS entity_tags"),
            'p.created_at AS created_at',
            'p.updated_at AS updated_at',
            'u.account_name AS account_name_from',
            'parent.blockchain_id AS parent_blockchain_id',
        ])
            .innerJoin(`${UsersModelProvider.getTableName()} AS u`, 'u.id', 'p.user_id')
            .innerJoin(`${PostsModelProvider.getTableName()} AS parent`, 'parent.id', 'p.parent_id')
            .where('p.post_type_id', ucom_libs_common_1.ContentTypesDictionary.getTypeRepost())
            .where('p.created_at', '<=', createdAtLessOrEqualThan)
            .orderBy('p.id', 'ASC')
            .limit(limit)
            .offset(offset);
    }
    static async resendPostsOneByOne(manyPosts, printPushResponse) {
        let processedCount = 0;
        for (const post of manyPosts) {
            if (processedCount % 100 === 0) {
                console.log(`Current processed count is: ${processedCount}`);
            }
            post.created_at = moment(post.created_at).utc().format();
            post.updated_at = moment(post.updated_at).utc().format();
            const signedTransaction = await PublicationsApi.signResendReposts(post.account_name_from, EosApi.getHistoricalSenderPrivateKey(), post.parent_blockchain_id, post, post.blockchain_id);
            const pushingResponse = await EosClient.pushTransaction(signedTransaction);
            if (printPushResponse) {
                console.log(`Transaction id: ${pushingResponse.transaction_id}`);
                console.dir(JSON.stringify(pushingResponse.processed.action_traces[0].act.data));
            }
            processedCount += 1;
        }
    }
}
module.exports = RepostResendingService;
