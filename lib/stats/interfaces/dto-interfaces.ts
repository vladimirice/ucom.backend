import { NumberToNumberCollection, StringToAnyCollection } from '../../common/interfaces/common-types';

interface ModelWithEventParamsDto {
  id: number;
  blockchain_id: string;
  current_rate: number;
}

interface EntityParamAggregatesDto {
  readonly entityId: number;
  readonly aggregates: NumberToNumberCollection;
}

interface PostIdToStats {
  [index: number]: PostStats
}

interface EventDbDataDto {
  readonly entity_id: number;
  readonly json_value: {
    data: StringToAnyCollection,
  };
  readonly entity_name: string;
  readonly entity_blockchain_id: string;
  readonly result_value: number;
}

interface EntitiesWithImportanceDelta {
  [index: number]: {
    readonly entity_id: number;
    readonly last_rate: number;
    readonly entity_name: string;
    readonly entity_blockchain_id: string;

    importance_delta: number;
  }
}

interface EntitiesWithDeltaFields {
  [index: number]: {
    readonly entity_id: number;
    readonly entity_name: string;
    readonly entity_blockchain_id: string;

    readonly last_value: number;
    first_value: number;
    delta_value: number;
  }
}

interface TotalStatsParams  {
  readonly providerFunc:        Function;

  readonly eventType:           number;
  readonly recalcInterval:      string;
  readonly description:         string;

  readonly eventGroup:          number;
  readonly eventSuperGroup:     number;
}

interface TotalCurrentParamsModel {
  [index: string]:  any;
  json_value:       TotalCurrentParamsJsonValue;
}

interface TotalCurrentParamsJsonValue {
  readonly event_type: number;
  readonly value: number;
  readonly recalc_interval: string;
  readonly description: string;
  readonly created_at: string;

  window_interval?: string;
}

interface DeltaParams {
  readonly entityName:    string;
  readonly paramField:    string;
  readonly isFloat:       boolean;

  readonly windowIntervalHours: number
  readonly windowIntervalIso?: number

  readonly initialEventType: number;

  readonly resultEventType: number;
  readonly eventGroup:      number;
  readonly eventSuperGroup: number;

  readonly paramFieldDelta: string;

  readonly description:     string;

  readonly currentParams?: {
    tableName:      string;
    fieldNameToSet: string;
    whenFieldName:  string;
  }
}

interface CurrentParams {
  readonly tableName:               string;
  readonly fieldNameToSet:          string;
  readonly whenFieldName:           string;
  readonly thenFieldNameFromSet:    string;
}

interface PostStats {
  comments: number;
  reposts: number;
  upvotes: number;
  downvotes: number;
}

interface OrgIdToStats {
  [index: number]: OrgStats
}

interface OrgStats {
  mediaPosts: number;
  directPosts: number;
  followers: number;
}

interface EntityAggregatesDto {
  readonly entityId:      number;
  readonly aggregates:  NumberToNumberCollection;
}

interface IStatsJobParams {
  entityName:                 string;
  entityLabel:                string;

  currentValuesFetchFunction: Function; // #task provide a signature
  currentValuesEventType:     number;
  currentValuesToSave:        string[];
}

export {
  EntityAggregatesDto,
  ModelWithEventParamsDto,
  EntityParamAggregatesDto,
  PostIdToStats,
  PostStats,
  OrgStats,
  OrgIdToStats,
  EventDbDataDto,
  EntitiesWithImportanceDelta,
  EntitiesWithDeltaFields,
  DeltaParams,
  CurrentParams,
  TotalStatsParams,
  TotalCurrentParamsJsonValue,
  TotalCurrentParamsModel,
  IStatsJobParams,
};
