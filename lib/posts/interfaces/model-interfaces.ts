import { MyselfDataDto } from '../../common/interfaces/post-processing-dto';
import { CommentsListResponse } from '../../comments/interfaces/model-interfaces';
import { ListResponse } from '../../common/interfaces/lists-interfaces';

interface PostModel {
  readonly id: number;
  readonly current_vote: number;
  readonly organization_id: number | null;
  readonly entity_tags: any;

  readonly post?: PostModelResponse;

  [index: string]: any;
}

interface PostsListResponse extends ListResponse {
  data: PostModelResponse[];
}

interface PostModelResponse extends PostModel {
  [index: string]: any;

  comments: CommentsListResponse;
}

interface PostModelMyselfResponse extends PostModelResponse {
  myselfData: MyselfDataDto,
}

interface PostRequestQueryDto {
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
