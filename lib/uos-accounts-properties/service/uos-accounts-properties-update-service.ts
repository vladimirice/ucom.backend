// @ts-ignore
import {
  UosAccountPropertiesDto,
  UosAccountPropertiesValuesDto,
  UosAccountsResponseDto,
} from '../interfaces/model-interfaces';

// @ts-ignore
import UsersModelProvider = require('../../users/users-model-provider');
import BatchProcessingHelper = require('../../common/helper/batch-processing-helper');
import UosAccountsPropertiesFetchService = require('./uos-accounts-properties-fetch-service');
import knex = require('../../../config/knex');

class UosAccountsPropertiesUpdateService {
  public static async updateAll(limit: number = 2): Promise<void> {
    const fetchFunction = UosAccountsPropertiesFetchService.getData;
    const processingFunction = UosAccountsPropertiesUpdateService.processBatchResult;
    const breakingFunction = response => response.accounts.length === 0;

    await BatchProcessingHelper.processWithBatch(
      fetchFunction,
      breakingFunction,
      processingFunction,
      limit,
    );

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
    response: UosAccountsResponseDto,
  ): Promise<void> {
    const accountsProperties: UosAccountPropertiesDto[] = response.accounts;

    let values = '';
    // @ts-ignore
    for (const propertiesList of accountsProperties) {
      const properties: UosAccountPropertiesValuesDto = propertiesList.values;

      const fields = {
        account_name: {
          key: 'name',
          type: 'string',
        },
        staked_balance: {
          key: 'staked_balance',
          type: 'number',
        },
        validity: {
          key: 'validity',
          type: 'number',
        },
        importance: {
          key: 'importance',
          type: 'number',
        },
        scaled_importance: {
          key: 'scaled_importance',
          type: 'number',
        },
        stake_rate: {
          key: 'stake_rate',
          type: 'number',
        },
        scaled_stake_rate: {
          key: 'scaled_stake_rate',
          type: 'number',
        },
        social_rate: {
          key: 'social_rate',
          type: 'number',
        },
        scaled_social_rate: {
          key: 'scaled_social_rate',
          type: 'number',
        },
        transfer_rate: {
          key: 'transfer_rate',
          type: 'number',
        },
        scaled_transfer_rate: {
          key: 'scaled_transfer_rate',
          type: 'number',
        },
        previous_cumulative_emission: {
          key: 'previous_cumulative_emission',
          type: 'number',
        },
        current_emission: {
          key: 'current_emission',
          type: 'number',
        },
        current_cumulative_emission: {
          key: 'current_cumulative_emission',
          type: 'number',
        },
      };


      // TODO
      for (const oneField of fields) {
        values += `
        (
          '${propertiesList.name}', 
          ${properties.staked_balance},
          ${properties.validity},
         
        )
      `;
      }
    }

    const sql = `
        UPDATE uos_accounts_properties AS t 
        SET
            current_rate = properties.scaled_social_rate
            current_rate = properties.scaled_social_rate
        FROM (VALUES
                  ('vladvladvlad', 77777),
                  ('janejanejane', 55555)
             ) AS properties (account_name, scaled_social_rate)
            WHERE t.account_name = properties.account_name;
    `;

    if (values.length > 0) {
      await knex.raw(sql);
    }

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
