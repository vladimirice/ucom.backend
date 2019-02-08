"use strict";
/* tslint:disable:max-line-length */
/* eslint-disable no-console */
const { TransactionSender } = require('ucom-libs-social-transactions');
const models = require('../../models');
const ENTITY_EVENT_TABLE_NAME = 'entity_event_param';
const postsModelProvider = require('../posts/service/posts-model-provider');
const orgModelProvider = require('../organizations/service/organizations-model-provider');
const usersModelProvider = require('../users/users-model-provider');
const eventTypeDictionary = require('./dictionary/EventTypeDictionary');
class EosImportance {
    static async updateRatesByBlockchain(doWriteEventType) {
        let lowerBound = 0;
        const batchSize = 100;
        let importanceData = await TransactionSender.getImportanceTableRows(lowerBound, batchSize);
        const doWriteEvent = doWriteEventType === 2
            ? !(await this.isHourlyEventWritten())
            : !!doWriteEventType;
        console.log(`doWriteEvent value is: ${doWriteEvent}`);
        let totalAmount = 0;
        while (importanceData.length !== 0) {
            totalAmount += importanceData.length;
            await this.processBatchResult(importanceData, doWriteEvent);
            lowerBound += batchSize;
            importanceData = await TransactionSender.getImportanceTableRows(lowerBound, batchSize);
        }
        console.log(`Total amount is: ${totalAmount}`);
    }
    static getImportanceMultiplier() {
        return 10000;
    }
    static async processBatchResult(importanceData, doWriteEvent) {
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
                promises.push(models.sequelize.query(sql));
                if (doWriteEvent) {
                    const jsonData = `{"importance": ${rateValue}}`;
                    entityEventSqlValues.push(`('${blockchainIdValue}', '${entityName}', '${jsonData}', ${eventType})`);
                }
            }
        });
        console.log('Lets run all updates for current rate...');
        await Promise.all(promises);
        console.log('Done');
        if (doWriteEvent) {
            await this.processEntityEventParam(entityEventSqlValues);
        }
    }
    static async isHourlyEventWritten() {
        const lastEventSql = `
    SELECT COUNT(1)
      FROM ${ENTITY_EVENT_TABLE_NAME}
    WHERE
          created_at::date = NOW()::date
          AND date_part('hour', created_at) = date_part('hour', NOW())
    `;
        // noinspection JSCheckFunctionSignatures
        const lastEventLateEnough = await models.sequelize.query(lastEventSql, { type: models.sequelize.QueryTypes.SELECT });
        return +lastEventLateEnough[0].count > 0;
    }
    /**
     *
     * @param {Array} entityEventSqlValues
     * @returns {Promise<void>}
     * @private
     */
    static async processEntityEventParam(entityEventSqlValues) {
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
}
module.exports = EosImportance;
