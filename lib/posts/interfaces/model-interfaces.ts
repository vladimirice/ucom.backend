import {MyselfDataDto} from "../../common/interfaces/post-processing-dto";

interface PostModel {
  readonly id: number;
  readonly current_vote: number;
  readonly organization_id: number | null;

  [index: string]: any;
}

interface PostModelResponse extends PostModel {
  [index: string]: any;
}

interface PostModelMyselfResponse extends PostModelResponse {
  myselfData: MyselfDataDto,
}

export {
  PostModel,
  PostModelResponse,
  PostModelMyselfResponse,
};
