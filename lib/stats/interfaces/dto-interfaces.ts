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

interface PostIdToStats {
  [index: number]: PostStats
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
};
