"use strict";
const BatchProcessingHelper = require("../../common/helper/batch-processing-helper");
const UosAccountsPropertiesFetchService = require("./uos-accounts-properties-fetch-service");
const knex = require("../../../config/knex");
class UosAccountsPropertiesUpdateService {
    static async updateAll(limit = 2) {
        const fetchFunction = UosAccountsPropertiesFetchService.getData;
        const processingFunction = UosAccountsPropertiesUpdateService.processBatchResult;
        const breakingFunction = response => response.accounts.length === 0;
        await BatchProcessingHelper.processWithBatch(fetchFunction, breakingFunction, processingFunction, limit);
        // Call appropriate library
        // Fetch data
        // return data
        // This is a wrapper only
        //
        // How to fetch with pagination
        /*
    
          1 - fetch a couple
          2 - process a couple
          3 - move to the next portion
    
         */
    }
    static async processBatchResult(
    // @ts-ignore
    response) {
        const accountsProperties = response.accounts;
        // @ts-ignore
        for (const properties of accountsProperties) {
            // @ts-ignore
            const a = 0;
        }
        const sql = `
        UPDATE "Users" AS t 
        SET
            current_rate = properties.scaled_social_rate
        FROM (VALUES
                  ('vladvladvlad', 77777),
                  ('janejanejane', 55555)
             ) AS properties (account_name, scaled_social_rate)
            WHERE t.account_name = properties.account_name;
    `;
        await knex.raw(sql);
        // const promises: Promise<any>[] = [];
        // importanceData.forEach((data: ImportanceData) => {
        //   const blockchainIdValue: string = data.acc_name;
        //   const rateValue: number = data.value;
        //
        //   const tableName: string = UsersModelProvider.getTableName();
        //   const field: string = UsersModelProvider.getBlockchainIdFieldName();
        //
        //   if (!blockchainIdValue.startsWith('pstms15-') && rateValue) {
        //     const sql: string = `UPDATE "${tableName}" SET current_rate = ${rateValue} WHERE ${field} = '${blockchainIdValue}'`;
        //     promises.push(models.sequelize.query(sql));
        //   }
        // });
        // console.log('Lets run all updates for current rate...');
        // await Promise.all(promises);
        // console.log('Done');
    }
}
module.exports = UosAccountsPropertiesUpdateService;
