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
    const fields = {
      account_name: {
        key: 'account_name',
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

    const accountsProperties: UosAccountPropertiesDto[] = response.accounts;
    if (response.accounts.length === 0) {
      return;
    }

    const manyAccountsValues: any[] = [];
    // @ts-ignore
    for (const propertiesList of accountsProperties) {
      const properties: UosAccountPropertiesValuesDto = propertiesList.values;

      // @ts-ignore
      properties.account_name = propertiesList.name;

      const oneAccountValues: any[] = [];
      for (const index in fields) {
        if (!fields.hasOwnProperty(index)) {
          continue;
        }

        const oneFieldSet = fields[index];

        if (oneFieldSet.type === 'string') {
          oneAccountValues.push(`'${properties[oneFieldSet.key]}'`);
        } else {
          oneAccountValues.push(properties[oneFieldSet.key]);
        }
      }

      manyAccountsValues.push(`(${oneAccountValues.join(', ')})`);
    }


    const arrayToSet: string[] = [];
    for (const key in fields) {
      if (!fields.hasOwnProperty(key)) {
        continue;
      }
      arrayToSet.push(`${key} = EXCLUDED.${key}`);
    }

    const sql = `
        INSERT INTO blockchain.uos_accounts_properties
      (${Object.keys(fields).join(', ')})
    VALUES ${manyAccountsValues.join(',\n')}
    ON CONFLICT (account_name) DO
    UPDATE
        SET ${arrayToSet.join(',\n')}
    ;
    `;

    // const sql = `
    //     UPDATE blockchain.uos_accounts_properties AS t
    //     SET ${`\n${arrayToSet.join(',\n')}`}
    //     FROM (${`\nVALUES ${manyAccountsValues.join(',\n')}`}
    //          ) AS p (${Object.keys(fields).join(', ')})
    //         WHERE t.account_name = p.account_name;
    //`;

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

export = UosAccountsPropertiesUpdateService;
