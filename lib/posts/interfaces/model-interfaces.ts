import { MyselfDataDto } from '../../common/interfaces/post-processing-dto';
import { CommentsListResponse } from '../../comments/interfaces/model-interfaces';
import { ListResponse } from '../../common/interfaces/lists-interfaces';
import { RequestQueryDto } from '../../api/filters/interfaces/query-filter-interfaces';
import { OrgModelCard } from '../../organizations/interfaces/model-interfaces';
import { UserModelCard } from '../../users/interfaces/model-interfaces';

interface PostModel {
  readonly id: number;
  readonly current_vote: number;
  readonly organization_id: number | null;
  readonly entity_tags: any;
  readonly entity_name_for: string;
  readonly entity_id_for: number;
  readonly post_type_id: number;

  readonly post?: PostModel; // for repost. Repost includes reposted post

  [index: string]: any;
}

interface PostsListResponse extends ListResponse {
  data: PostModelResponse[];
}

interface PostModelResponse extends PostModel {
  [index: string]: any;

  entity_for_card: OrgModelCard | UserModelCard;

  comments: CommentsListResponse;
}

interface PostModelMyselfResponse extends PostModelResponse {
  myselfData: MyselfDataDto,
}

interface PostRequestQueryDto extends RequestQueryDto {
  readonly post_type_id?: number;
  readonly created_at?: string;
}

export {
  PostModel,
  PostModelResponse,
  PostModelMyselfResponse,
  PostsListResponse,
  PostRequestQueryDto,
};
