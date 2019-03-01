import { TotalCurrentParamsJsonValue, TotalStatsParams } from '../interfaces/dto-interfaces';
import { EntityEventRepository } from '../repository/entity-event-repository';
import { EntityEventParamDto } from '../interfaces/model-interfaces';

import TotalsJobParams = require('../job-params/totals-job-params');
import CommonModelProvider = require('../../common/service/common-model-provider');
import TotalCurrentParamsRepository = require('../repository/total-current-params-repository');
import moment = require('moment');

class EntityTotalsCalculator {
  public static async calculate(): Promise<void> {
    const paramsSet = TotalsJobParams.getCurrentNumberSet();

    for (const params of paramsSet) {
      await this.calculateByParams(params);
    }
  }

  private static async calculateByParams(params: TotalStatsParams) {
    const resultValue: number = await params.providerFunc();

    const jsonValue = {
      description:      params.description,
      recalc_interval:  params.recalcInterval,
    };

    const createdAt = moment().utc().format();

    const event: EntityEventParamDto = {
      entity_id:            CommonModelProvider.getFakeEntityId(),
      entity_blockchain_id: CommonModelProvider.getFakeBlockchainId(),
      entity_name:          CommonModelProvider.getEntityName(),
      event_type:           params.eventType,
      event_group:          params.eventGroup,
      event_super_group:    params.eventSuperGroup,
      // @ts-ignore
      json_value:           jsonValue,
      result_value:         resultValue,

      created_at: createdAt,
    };

    await EntityEventRepository.insertOneEvent(event);

    const jsonValueForCurrent: TotalCurrentParamsJsonValue = {
      event_type:       params.eventType,
      value:            resultValue,
      recalc_interval:  params.recalcInterval,
      description:      params.description,
      created_at:       createdAt,
    };

    await TotalCurrentParamsRepository.updateCurrentParamsByEventType(
      params.eventType,
      jsonValueForCurrent,
      resultValue,
    );
  }
}

export = EntityTotalsCalculator;
