"use strict";
/* tslint:disable:max-line-length */
const models = require('../../models');
const { TransactionSender } = require('ucom-libs-social-transactions');
const ENTITY_EVENT_TABLE_NAME = 'entity_event_param';
const postsModelProvider = require('../posts/service/posts-model-provider');
const orgModelProvider = require('../organizations/service/organizations-model-provider');
const usersModelProvider = require('../users/users-model-provider');
const eventTypeDictionary = require('./dictionary/EventTypeDictionary');
class EosImportance {
    /**
     *
     * @return {Promise<*>}
     */
    static async updateRatesByBlockchain() {
        let lowerBound = 0;
        const batchSize = 1000;
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
    static async processBatchResult(importanceData) {
        const eventType = eventTypeDictionary.getTypeRateFromBlockchain();
        const promises = [];
        const entityEventSqlValues = [];
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
            const entityName = modelProvider.getEntityName();
            if (!blockchainIdValue.startsWith('pstms15-') && rateValue) {
                const sql = `UPDATE "${tableName}" SET current_rate = ${rateValue} WHERE ${field} = '${blockchainIdValue}'`;
                const jsonData = `{"importance": ${rateValue}}`;
                entityEventSqlValues.push(`('${blockchainIdValue}', '${entityName}', '${jsonData}', ${eventType})`);
                promises.push(models.sequelize.query(sql));
            }
        });
        console.log('Lets run all updates for current rate...');
        await Promise.all(promises);
        console.log('Done');
        await this.processEntityEventParam(entityEventSqlValues);
    }
    /**
     *
     * @param {Array} entityEventSqlValues
     * @returns {Promise<void>}
     * @private
     */
    static async processEntityEventParam(entityEventSqlValues) {
        const lastEventSql = `
    SELECT COUNT(1)
      FROM ${ENTITY_EVENT_TABLE_NAME}
    WHERE
          created_at::date = NOW()::date
          AND date_part('hour', created_at) = date_part('hour', NOW())
    `;
        // noinspection JSCheckFunctionSignatures
        const lastEventLateEnough = await models.sequelize.query(lastEventSql, { type: models.sequelize.QueryTypes.SELECT });
        if (+lastEventLateEnough[0].count > 0) {
            return;
        }
        const entityEventSql = `
        INSERT INTO ${ENTITY_EVENT_TABLE_NAME}
            (entity_blockchain_id, entity_name, json_value, event_type)
          VALUES
            ${entityEventSqlValues.join(', ')}
        ;
      `;
        console.log('Lets run all inserts for rate events...');
        await models.sequelize.query(entityEventSql);
        console.log('Done');
    }
    /**
     *
     * @return {number}
     */
    static getImportanceMultiplier() {
        return 10000;
    }
}
module.exports = EosImportance;
