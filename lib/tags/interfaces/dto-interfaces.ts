import { ListResponse } from '../../common/interfaces/lists-interfaces';
import { ModelWithEventParamsDto } from '../../stats/interfaces/dto-interfaces';

interface PostWithTagCurrentRateDto {
  readonly current_rate: number;
  readonly post_type_id: number;

  readonly entity_tags: string[];
}

interface TagWithEventParamsDto extends ModelWithEventParamsDto {
  readonly current_posts_amount: number;
  readonly current_media_posts_amount: number;
  readonly current_direct_posts_amount: number;
}

interface TagToRate {
  title:              string;
  ratePerPost:        number;
  postsAmount:        number;
  currentRate:        number;
  mediaPostsAmount:   number;
  directPostsAmount:  number;
}

// #task DbTag name breaks naming conventions
interface DbTag {
  readonly id: number;
  readonly title: string;
  readonly current_rate: number;
  readonly created_at: string;
  readonly current_posts_amount: number;
  readonly current_media_posts_amount: number;
  readonly current_direct_posts_amount: number;
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
  TagWithEventParamsDto,
};
