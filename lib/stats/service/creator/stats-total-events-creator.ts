import { EntityEventParamDto } from '../../interfaces/model-interfaces';
import { EntityEventRepository } from '../../repository/entity-event-repository';
import { TotalCurrentParamsJsonValue } from '../../interfaces/dto-interfaces';

import CommonModelProvider = require('../../../common/service/common-model-provider');
import TotalCurrentParamsRepository = require('../../repository/total-current-params-repository');

class StatsTotalEventsCreator {
  public static async createTotalEvent(
    params: any,
    resultValue: number,
    createdAt: string,
  ): Promise<void> {
    const jsonValue: any = {
      description:      params.description,
      recalc_interval:  params.recalcInterval,
    };

    if (params.windowIntervalIso) {
      jsonValue.window_interval = params.windowIntervalIso;
    }

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

      created_at:           createdAt,
    };

    await EntityEventRepository.insertOneEvent(event);
  }

  public static async upsertCurrentTotalParams(
    params: any,
    resultValue: number,
    createdAt: string,
  ): Promise<void> {
    const jsonValueForCurrent: TotalCurrentParamsJsonValue = {
      event_type:       params.eventType,
      value:            resultValue,
      recalc_interval:  params.recalcInterval,
      description:      params.description,
      created_at:       createdAt,
    };

    if (params.windowIntervalIso) {
      jsonValueForCurrent.window_interval = params.windowIntervalIso;
    }

    await TotalCurrentParamsRepository.updateCurrentParamsByEventType(
      params.eventType,
      jsonValueForCurrent,
      resultValue,
    );
  }
}

export = StatsTotalEventsCreator;
