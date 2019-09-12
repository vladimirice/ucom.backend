/* tslint:disable:max-line-length */
/* eslint-disable no-console */
const { TransactionSender } = require('ucom-libs-social-transactions');
const models = require('../../models');

const postsModelProvider = require('../posts/service/posts-model-provider');
const orgModelProvider = require('../organizations/service/organizations-model-provider');
const usersModelProvider = require('../users/users-model-provider');

interface ImportanceData {
  readonly acc_name: string;
  readonly value: number;
}

class EosImportance {
  public static async updateRatesByBlockchain(): Promise<void> {
    let lowerBound: number = 0;
    const batchSize: number = 500;

    let importanceData: ImportanceData[] =
      await TransactionSender.getImportanceTableRows(lowerBound, batchSize);

    let totalAmount: number = 0;
    while (importanceData.length !== 0) {
      totalAmount += importanceData.length;
      await this.processBatchResult(importanceData);

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
  ): Promise<void> {
    const promises: Promise<any>[] = [];

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

      if (!blockchainIdValue.startsWith('pstms15-') && rateValue) {
        const sql: string = `UPDATE "${tableName}" SET current_rate = ${rateValue} WHERE ${field} = '${blockchainIdValue}'`;
        promises.push(models.sequelize.query(sql));
      }
    });
    console.log('Lets run all updates for current rate...');
    await Promise.all(promises);
    console.log('Done');
  }
}

export = EosImportance;
