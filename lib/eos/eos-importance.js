"use strict";
/* tslint:disable:max-line-length */
/* eslint-disable no-console */
const { TransactionSender } = require('ucom-libs-social-transactions');
const models = require('../../models');
const postsModelProvider = require('../posts/service/posts-model-provider');
const orgModelProvider = require('../organizations/service/organizations-model-provider');
const usersModelProvider = require('../users/users-model-provider');
class EosImportance {
    static async updateRatesByBlockchain() {
        let lowerBound = 0;
        const batchSize = 100;
        let importanceData = await TransactionSender.getImportanceTableRows(lowerBound, batchSize);
        let totalAmount = 0;
        while (importanceData.length !== 0) {
            totalAmount += importanceData.length;
            await this.processBatchResult(importanceData);
            lowerBound += batchSize;
            importanceData = await TransactionSender.getImportanceTableRows(lowerBound, batchSize);
        }
        console.log(`Total amount is: ${totalAmount}`);
    }
    static getImportanceMultiplier() {
        return 10000;
    }
    static async processBatchResult(importanceData) {
        const promises = [];
        importanceData.forEach((data) => {
            const blockchainIdValue = data.acc_name;
            const rateValue = data.value;
            let modelProvider;
            if (blockchainIdValue.startsWith('pst')) {
                modelProvider = postsModelProvider;
            }
            else if (blockchainIdValue.startsWith('org-')) {
                modelProvider = orgModelProvider;
            }
            else {
                modelProvider = usersModelProvider;
            }
            const tableName = modelProvider.getTableName();
            const field = modelProvider.getBlockchainIdFieldName();
            if (!blockchainIdValue.startsWith('pstms15-') && rateValue) {
                const sql = `UPDATE "${tableName}" SET current_rate = ${rateValue} WHERE ${field} = '${blockchainIdValue}'`;
                promises.push(models.sequelize.query(sql));
            }
        });
        console.log('Lets run all updates for current rate...');
        await Promise.all(promises);
        console.log('Done');
    }
}
module.exports = EosImportance;
