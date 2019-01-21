interface CommentModel {
  readonly id: number;
  readonly commentable_id: number;
  readonly depth: number;
  readonly parent_id: number | null;

  [index: string]: any;
}

interface CommentModelResponse extends CommentModel {
  readonly metadata: CommentMetadataResponse
}


interface CommentMetadataResponse {
  readonly next_depth_total_amount: number;
}

export {
  CommentModel,
  CommentModelResponse,
};
