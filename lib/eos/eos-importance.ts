/* tslint:disable:max-line-length */
/* eslint-disable no-console */
const { TransactionSender } = require('ucom-libs-social-transactions');
const models = require('../../models');

const ENTITY_EVENT_TABLE_NAME = 'entity_event_param';

const postsModelProvider = require('../posts/service/posts-model-provider');
const orgModelProvider = require('../organizations/service/organizations-model-provider');
const usersModelProvider = require('../users/users-model-provider');

const eventTypeDictionary = require('./dictionary/EventTypeDictionary');

interface ImportanceData {
  readonly acc_name: string;
  readonly value: number;
}

class EosImportance {
  public static async updateRatesByBlockchain(): Promise<void> {
    let lowerBound: number = 0;
    const batchSize: number = 1000;

    let importanceData: ImportanceData[] =
      await TransactionSender.getImportanceTableRows(lowerBound, batchSize);

    const doWriteEvent: boolean = !(await this.isHourlyEventWritten());

    let totalAmount: number = 0;
    while (importanceData.length !== 0) {
      totalAmount += importanceData.length;
      await this.processBatchResult(importanceData, doWriteEvent);

      lowerBound += batchSize;

      importanceData = await TransactionSender.getImportanceTableRows(lowerBound, batchSize);
    }

    console.log(`Total amount is: ${totalAmount}`);
  }

  public static getImportanceMultiplier(): number {
    return 10000;
  }

  private static async processBatchResult(
    importanceData: ImportanceData[],
    doWriteEvent: boolean,
  ): Promise<void> {
    const eventType: number = eventTypeDictionary.getTypeRateFromBlockchain();

    const promises: Promise<any>[] = [];
    const entityEventSqlValues: string[] = [];

    importanceData.forEach((data: ImportanceData) => {
      const blockchainIdValue: string = data.acc_name;
      const rateValue: number = data.value;

      let modelProvider;
      if (blockchainIdValue.startsWith('pst')) {
        modelProvider = postsModelProvider;
      } else if (blockchainIdValue.startsWith('org-')) {
        modelProvider = orgModelProvider;
      } else {
        modelProvider = usersModelProvider;
      }

      const tableName: string = modelProvider.getTableName();
      const field: string = modelProvider.getBlockchainIdFieldName();
      const entityName: string = modelProvider.getEntityName();

      if (!blockchainIdValue.startsWith('pstms15-') && rateValue) {
        const sql: string = `UPDATE "${tableName}" SET current_rate = ${rateValue} WHERE ${field} = '${blockchainIdValue}'`;
        promises.push(models.sequelize.query(sql));

        if (doWriteEvent) {
          const jsonData: string = `{"importance": ${rateValue}}`;

          entityEventSqlValues.push(
            `('${blockchainIdValue}', '${entityName}', '${jsonData}', ${eventType})`,
          );
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

  private static async isHourlyEventWritten(): Promise<boolean> {
    const lastEventSql: string = `
    SELECT COUNT(1)
      FROM ${ENTITY_EVENT_TABLE_NAME}
    WHERE
          created_at::date = NOW()::date
          AND date_part('hour', created_at) = date_part('hour', NOW())
    `;

    // noinspection JSCheckFunctionSignatures
    const lastEventLateEnough = await models.sequelize.query(
      lastEventSql,
      { type: models.sequelize.QueryTypes.SELECT },
    );

    return +lastEventLateEnough[0].count > 0;
  }

  /**
   *
   * @param {Array} entityEventSqlValues
   * @returns {Promise<void>}
   * @private
   */
  private static async processEntityEventParam(entityEventSqlValues: string[]): Promise<void> {
    const entityEventSql: string = `
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

export = EosImportance;
