"use strict";
const EosApi = require("../../../eos/eosApi");
const knex = require("../../../../config/knex");
const PostsModelProvider = require("../posts-model-provider");
const UsersModelProvider = require("../../../users/users-model-provider");
const OrganizationsModelProvider = require("../../../organizations/service/organizations-model-provider");
const { ContentTypeDictionary } = require('ucom-libs-social-transactions');
const { PublicationsApi } = require('ucom-libs-wallet').Content;
const { EosClient } = require('ucom-libs-wallet');
const moment = require('moment');
class MediaPostResendingService {
    static async resendMediaPosts(createdAtLessOrEqualThan, limit, printPushResponse = false) {
        EosApi.initBlockchainLibraries();
        const manyPosts = await this.getManyMediaPosts(createdAtLessOrEqualThan, limit);
        await this.resendPostsOneByOne(manyPosts, printPushResponse);
        return {
            totalProcessedCounter: manyPosts.length,
            totalSkippedCounter: 0,
        };
    }
    static getManyMediaPosts(createdAtLessOrEqualThan, limit) {
        return knex(`${PostsModelProvider.getTableName()} AS p`)
            .select([
            'p.blockchain_id as blockchain_id',
            'p.title as title',
            'p.leading_text as leading_text',
            'p.description as description',
            'p.entity_images AS entity_images',
            knex.raw("COALESCE(p.entity_tags, '{}'::text[]) AS entity_tags"),
            'p.created_at AS created_at',
            'p.updated_at AS updated_at',
            'u.account_name AS account_name_from',
            'o.blockchain_id AS organization_blockchain_id',
        ])
            .innerJoin(`${UsersModelProvider.getTableName()} AS u`, 'u.id', 'p.user_id')
            .leftJoin(`${OrganizationsModelProvider.getTableName()} AS o`, 'o.id', 'p.organization_id')
            .where('p.post_type_id', ContentTypeDictionary.getTypeMediaPost())
            .where('p.created_at', '<=', createdAtLessOrEqualThan)
            .orderBy('p.id', 'ASC')
            .limit(limit);
    }
    static async resendPostsOneByOne(manyPosts, printPushResponse) {
        for (const post of manyPosts) {
            post.created_at = moment(post.created_at).utc().format();
            post.updated_at = moment(post.updated_at).utc().format();
            let signedTransaction;
            if (post.organization_blockchain_id === null) {
                signedTransaction = await PublicationsApi.signResendPublicationFromUser(post.account_name_from, EosApi.getHistoricalSenderPrivateKey(), post, post.blockchain_id);
            }
            else {
                signedTransaction = await PublicationsApi.signResendPublicationFromOrganization(post.account_name_from, EosApi.getHistoricalSenderPrivateKey(), post.organization_blockchain_id, post, post.blockchain_id);
            }
            const pushingResponse = await EosClient.pushTransaction(signedTransaction);
            if (printPushResponse) {
                console.log(`Transaction id: ${pushingResponse.transaction_id}`);
                console.dir(JSON.stringify(pushingResponse.processed.action_traces[0].act.data));
            }
        }
    }
}
module.exports = MediaPostResendingService;
