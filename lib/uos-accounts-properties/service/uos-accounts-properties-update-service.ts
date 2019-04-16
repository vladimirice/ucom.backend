import { UosAccountPropertiesDto, UosAccountsResponseDto } from '../interfaces/model-interfaces';

import ImportanceFetchService = require('./uos-accounts-properties-fetch-service');

// @ts-ignore
import UsersModelProvider = require('../../users/users-model-provider');

class UosAccountsPropertiesUpdateService {
  public static async updateAll(limit: number = 2): Promise<void> {
    // foreach in order to provide pagination during updating

    // TODO - pagination via decorator
    const lowerBound = 1;

    // @ts-ignore
    const data: UosAccountsResponseDto = await ImportanceFetchService.getData(lowerBound, limit);
    this.processBatchResult(data.accounts);

    // @ts-ignore
    const a = 0;

    // TODO - implement real fetching


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

  private static async processBatchResult(
    // @ts-ignore
    properties: UosAccountPropertiesDto[],
  ): Promise<void> {
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

export = UosAccountsPropertiesUpdateService;
