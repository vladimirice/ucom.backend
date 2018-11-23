const models = require('../../models');
const { TransactionSender } = require('uos-app-transaction');

const ENTITY_EVENT_TABLE_NAME = 'entity_event_param';

const PostsModelProvider  = require('../posts/service/posts-model-provider');
const OrgModelProvider    = require('../organizations/service/organizations-model-provider');
const UsersModelProvider  = require('../users/users-model-provider');

const EventTypeDictionary = require('./dictionary/EventTypeDictionary');

class EosImportance {

  /**
   *
   * @return {Promise<*>}
   */
  static async updateRatesByBlockchain() {
    let lowerBound = 0;
    let batchSize = 1000;

    let importanceData = await TransactionSender.getImportanceTableRows(lowerBound, batchSize);

    let totalAmount = 0;
    while (importanceData.length !== 0) {
      totalAmount += importanceData.length;
      await this._processBatchResult(importanceData);

      lowerBound += batchSize;

      importanceData = await TransactionSender.getImportanceTableRows(lowerBound, batchSize);
    }

    console.log(`Total amount is: ${totalAmount}`);
  }

  static async _processBatchResult(importanceData) {
    const eventType = EventTypeDictionary.getTypeRateFromBlockchain();

    let promises = [];
    const entityEventSqlValues = [];

    importanceData.forEach((data) => {
      const blockchainIdValue   = data.acc_name;
      const rateValue           = data.value;

      let ModelProvider;
      if (blockchainIdValue.startsWith("pst")) {
        ModelProvider = PostsModelProvider;
      } else if (blockchainIdValue.startsWith("org-")) {
        ModelProvider = OrgModelProvider;
      } else {
        ModelProvider = UsersModelProvider;
      }

      const tableName   = ModelProvider.getTableName();
      const field       = ModelProvider.getBlockchainIdFieldName();
      const entityName  = ModelProvider.getEntityName();

      if (!blockchainIdValue.startsWith('pstms15-')) {
        const sql = `UPDATE "${tableName}" SET current_rate = ${rateValue} WHERE ${field} = '${blockchainIdValue}'`;

        const json_data = `{"importance": ${rateValue}}`;

        entityEventSqlValues.push(
          `('${blockchainIdValue}', '${entityName}', '${json_data}', ${eventType})`
        );

        promises.push(models.sequelize.query(sql));
      }
    });
    console.log('Lets run all updates for current rate...');
    await Promise.all(promises);
    console.log('Done');

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
  static getImportanceMultiplier () {
    return 10000;
  }
}

module.exports = EosImportance;