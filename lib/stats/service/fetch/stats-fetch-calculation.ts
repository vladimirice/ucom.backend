import { DeltaParams, EventDbDataDto } from '../../interfaces/dto-interfaces';
import { EntityEventRepository } from '../../repository/entity-event-repository';

import moment = require('moment');

class StatsFetchCalculation {
  public static async findStatsData(
    params: DeltaParams,
  ): Promise<[EventDbDataDto[], EventDbDataDto[]]> {
    const newData = moment().subtract(params.windowIntervalHours, 'hours');
    const createdAtAsString = newData.utc().format('YYYY-MM-DD HH:mm:ss');

    return Promise.all([
      EntityEventRepository.findLastRowsGroupedByEntity(
        `event_type = ${params.initialEventType} AND entity_name = '${params.entityName}'`,
      ),
      EntityEventRepository.findLastRowsGroupedByEntity(
        `"event_type" = ${params.initialEventType} AND entity_name = '${params.entityName}' AND created_at < '${createdAtAsString}'`,
      ),
    ]);
  }
}

export = StatsFetchCalculation;
