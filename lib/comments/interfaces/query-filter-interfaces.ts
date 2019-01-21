import { DbParamsDto } from '../../api/filters/interfaces/query-filter-interfaces';

interface DbCommentParamsDto extends DbParamsDto {
  readonly commentable_id: number;
  readonly depth: number;
}

export {
  DbCommentParamsDto,
};
