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

interface DeltaParams {
  readonly entityName:    string;
  readonly paramField:    string;
  readonly isFloat:       boolean;

  readonly initialEventType: number;

  readonly resultEventType: number;
  readonly eventGroup:      number;
  readonly eventSuperGroup: number;

  readonly paramFieldDelta: string;
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

export {
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
};
