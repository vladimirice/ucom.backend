const models = require('../../models');
const { TransactionSender } = require('uos-app-transaction');

const ENTITY_EVENT_TABLE_NAME = 'entity_event_param';

const EVENT_TYPE__RATE_FROM_BLOCKCHAIN = 1;

const PostsModelProvider  = require('../posts/service/posts-model-provider');
const OrgModelProvider    = require('../organizations/service/organizations-model-provider');
const UsersModelProvider  = require('../users/users-model-provider');

class EosImportance {

  /**
   *
   * @return {Promise<*>}
   */
  static async updateRatesByBlockchain() {
    const importanceData = await TransactionSender.getImportanceTableRows();

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
          `('${blockchainIdValue}', '${entityName}', '${json_data}', ${EVENT_TYPE__RATE_FROM_BLOCKCHAIN})`
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