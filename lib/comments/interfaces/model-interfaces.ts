import { ListResponse } from '../../common/interfaces/lists-interfaces';
import { ModelWithEntityImages } from '../../entity-images/interfaces/model-interfaces';

interface CommentModelInterface {}

interface CommentModelInput extends CommentModelInterface, ModelWithEntityImages {
  commentable_id: number;
  depth: number;
  parent_id: number | null;
  organization_id: number | null;
  organization: any;

  user_id: number;
}

interface CommentModel extends CommentModelInterface {
  readonly id: number;
  readonly commentable_id: number;
  readonly depth: number;
  readonly parent_id: number | null;
  readonly organization_id: number | null;
  readonly organization: any;

  [index: string]: any;
}

interface ParentIdToDbCommentCollection {
  [index: number]: CommentModel[];
}

interface CommentModelResponse extends CommentModel, ModelWithEntityImages {
  readonly metadata: CommentMetadataResponse;
}

interface CommentsListResponse extends ListResponse {
  data: CommentModelResponse[];
}

interface CommentableIdToCommentsResponse {
  [index: number]: CommentsListResponse,
}

interface CommentMetadataResponse {
  readonly next_depth_total_amount: number;
}

export {
  CommentModelInput,
  CommentModel,
  CommentModelResponse,
  CommentsListResponse,
  ParentIdToDbCommentCollection,
  CommentableIdToCommentsResponse,
};
