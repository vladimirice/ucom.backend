import { ListResponse } from '../../common/interfaces/lists-interfaces';

interface PostWithTagCurrentRateDto {
  readonly current_rate: number;
  readonly entity_tags: string[];
}

interface TagToRate {
  title: string;
  ratePerPost: number;
  postsAmount: number;
  currentRate: number;
}

// #task DbTag name breaks naming conventions
interface DbTag {
  readonly id: number;
  readonly title: string;
  readonly current_rate: number;
  readonly created_at: string;
  readonly current_posts_amount: string;
  readonly first_entity_id: number;
}

// #task DbTag name breaks naming conventions
interface TagsModelResponse extends DbTag {
  entity_name: string;
}

interface TagsListResponse extends ListResponse {
  data: TagsModelResponse[];
}

export {
  PostWithTagCurrentRateDto,
  DbTag,
  TagToRate,
  TagsListResponse,
  TagsModelResponse,
};
