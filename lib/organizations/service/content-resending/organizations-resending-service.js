"use strict";
const EosApi = require("../../../eos/eosApi");
const knex = require("../../../../config/knex");
const UsersModelProvider = require("../../../users/users-model-provider");
const OrganizationsModelProvider = require("../../../organizations/service/organizations-model-provider");
const { OrganizationsApi } = require('ucom-libs-wallet').Content;
const { EosClient, WalletApi } = require('ucom-libs-wallet');
const moment = require('moment');
class OrganizationsResendingService {
    static async resendOrganizations(createdAtLessOrEqualThan, limit, printPushResponse = false, offset = 0) {
        EosApi.initBlockchainLibraries();
        const stateBefore = await WalletApi.getAccountState(EosApi.getHistoricalSenderAccountName());
        console.log(`Account sources: ${EosApi.getHistoricalSenderAccountName()}`);
        console.dir(stateBefore.resources);
        const manyPosts = await this.getManyOrganizations(createdAtLessOrEqualThan, limit, offset);
        await this.resendOrganizationOneByOne(manyPosts, printPushResponse);
        return {
            totalProcessedCounter: manyPosts.length,
            totalSkippedCounter: 0,
        };
    }
    static getManyOrganizations(createdAtLessOrEqualThan, limit, offset) {
        return knex(`${OrganizationsModelProvider.getTableName()} AS t`)
            .select([
            't.title as title',
            't.about as about',
            't.nickname as nickname',
            't.email AS email',
            't.personal_website_url AS personal_website_url',
            't.blockchain_id as blockchain_id',
            't.created_at AS created_at',
            't.updated_at AS updated_at',
            'u.account_name AS account_name_from',
        ])
            .innerJoin(`${UsersModelProvider.getTableName()} AS u`, 'u.id', 't.user_id')
            .where('t.created_at', '<=', createdAtLessOrEqualThan)
            .orderBy('t.id', 'ASC')
            .limit(limit)
            .offset(offset);
    }
    static async resendOrganizationOneByOne(manyOrganizations, printPushResponse) {
        let processedCount = 0;
        for (const organization of manyOrganizations) {
            if (processedCount % 100 === 0) {
                console.log(`Current processed count is: ${processedCount}`);
            }
            organization.created_at = moment(organization.created_at).utc().format();
            organization.updated_at = moment(organization.updated_at).utc().format();
            const signedTransaction = await OrganizationsApi.signResendOrganizations(organization.account_name_from, EosApi.getHistoricalSenderPrivateKey(), organization, organization.blockchain_id);
            const pushingResponse = await EosClient.pushTransaction(signedTransaction);
            if (printPushResponse) {
                console.log(`Transaction id: ${pushingResponse.transaction_id}`);
                console.dir(JSON.stringify(pushingResponse.processed.action_traces[0].act.data));
            }
            processedCount += 1;
        }
    }
}
module.exports = OrganizationsResendingService;
