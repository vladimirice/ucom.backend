import {
  UosAccountPropertiesDto, UosAccountPropertiesModelDto,
  UosAccountsResponseDto,
} from '../interfaces/model-interfaces';
import { StringToNumberCollection } from '../../common/interfaces/common-types';
import { InsertUpdateHelperFields } from '../../common/interfaces/options-dto';
import { TotalParametersResponse } from '../../common/interfaces/response-interfaces';

import UsersModelProvider = require('../../users/users-model-provider');
import BatchProcessingHelper = require('../../common/helper/batch-processing-helper');
import UosAccountsPropertiesFetchService = require('./uos-accounts-properties-fetch-service');
import knex = require('../../../config/knex');
import UsersRepository = require('../../users/users-repository');
import UosAccountsModelProvider = require('./uos-accounts-model-provider');
import InsertUpdateRepositoryHelper = require('../../common/helper/repository/insert-update-repository-helper');


const fields: InsertUpdateHelperFields = {
  entity_id: {
    key: 'entity_id',
    type: 'number',
  },
  entity_name: {
    key: 'entity_name',
    type: 'string',
  },
  account_name: {
    key: 'account_name',
    type: 'string',
  },
  staked_balance: {
    key: 'staked_balance',
    type: 'number',
  },
  // validity: {
  //   key: 'validity',
  //   type: 'number',
  // },
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

class UosAccountsPropertiesUpdateService {
  public static async updateAll(limit: number = 500): Promise<TotalParametersResponse> {
    const fetchFunction = UosAccountsPropertiesFetchService.getData;
    const processingFunction = UosAccountsPropertiesUpdateService.processBatchResult;
    const { countingFunction } = UosAccountsPropertiesUpdateService;
    const breakingFunction = response => response.accounts.length === 0;

    return BatchProcessingHelper.processWithBatch(
      fetchFunction,
      countingFunction,
      breakingFunction,
      processingFunction,
      limit,
    );
  }

  private static countingFunction(item: any) {
    return item.accounts.length;
  }

  private static async processBatchResult(
    response: UosAccountsResponseDto,
  ): Promise<{processedCounter: number, skippedCounter: number}> {
    const tableName = UosAccountsModelProvider.uosAccountsPropertiesTableName();

    let processedCounter = 0;
    let skippedCounter = 0;

    const accountsProperties: UosAccountPropertiesDto[] = response.accounts;
    if (response.accounts.length === 0) {
      return {
        processedCounter,
        skippedCounter,
      };
    }

    const accountNames: string[] = [];
    const manyItems: UosAccountPropertiesModelDto[] = [];
    for (const propertiesList of accountsProperties) {
      accountNames.push(propertiesList.name);
    }

    const userIdsByAccountNames: StringToNumberCollection =
      await UsersRepository.findUserIdsByAccountNames(accountNames);

    for (const propertiesList of accountsProperties) {
      if (!userIdsByAccountNames[propertiesList.name]) {
        skippedCounter += 1;
        continue;
      }

      manyItems.push({
        ...propertiesList.values,
        account_name: propertiesList.name,
        entity_id: userIdsByAccountNames[propertiesList.name],
        entity_name: UsersModelProvider.getEntityName(),
      });

      processedCounter += 1;
    }

    if (manyItems.length === 0) {
      return {
        processedCounter,
        skippedCounter,
      };
    }

    const sql = InsertUpdateRepositoryHelper.getUpsertManyRawSql(manyItems, tableName, fields);

    await knex.raw(sql);

    return {
      processedCounter,
      skippedCounter,
    };
  }
}

export = UosAccountsPropertiesUpdateService;
