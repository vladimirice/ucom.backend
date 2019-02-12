import { NumberToNumberCollection } from '../../common/interfaces/common-types';

interface ModelWithEventParamsDto {
  id: number;
  blockchain_id: string;
  current_rate: number;
}

interface EntityParamAggregatesDto {
  readonly entityId: number;
  readonly aggregates: NumberToNumberCollection;
}

export {
  ModelWithEventParamsDto,
  EntityParamAggregatesDto,
};
