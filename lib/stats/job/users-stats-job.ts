/* eslint-disable guard-for-in */
import {
  NumberToNumberCollection,
} from '../../common/interfaces/common-types';
import { IStatsJobParams } from '../interfaces/dto-interfaces';

import EventParamTypeDictionary = require('../dictionary/event-param/event-param-type-dictionary');
import PostsRepository = require('../../posts/posts-repository');
import CommonStatsJob = require('./common-stats-job');
import UsersModelProvider = require('../../users/users-model-provider');
import UosAccountsPropertiesRepository = require('../../uos-accounts-properties/repository/uos-accounts-properties-repository');
import UosAccountsModelProvider = require('../../uos-accounts-properties/service/uos-accounts-model-provider');

interface EntityAggregatesDto {
  readonly entityId:      number;
  readonly aggregates:  NumberToNumberCollection;
}

const params: IStatsJobParams = {
  entityName:                 UsersModelProvider.getEntityName(),
  entityLabel:                UsersModelProvider.getTableName(),

  currentValuesFetchFunction: UosAccountsPropertiesRepository.findManyForEntityEvents,
  currentValuesEventType:     EventParamTypeDictionary.getUserHimselfCurrentAmounts(),
  currentValuesToSave:        UosAccountsModelProvider.getFieldsToSelect(),
};

class UsersStatsJob {
  public static async processCurrentValues(batchSize: number = 500): Promise<void> {
    const data: EntityAggregatesDto[] = await PostsRepository.getManyUsersPostsAmount();
    const eventType:  number = EventParamTypeDictionary.getUsersPostsCurrentAmount();

    await CommonStatsJob.calculatePostsCurrentAmount(data, eventType, params.entityName, params.entityLabel);
    await CommonStatsJob.saveCurrentValues(params, batchSize);
  }
}

export = UsersStatsJob;
