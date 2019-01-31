import { ListResponse } from '../../common/interfaces/lists-interfaces';

interface CommentModel {
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

interface CommentModelResponse extends CommentModel {
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
  CommentModel,
  CommentModelResponse,
  CommentsListResponse,
  ParentIdToDbCommentCollection,
  CommentableIdToCommentsResponse,
};
