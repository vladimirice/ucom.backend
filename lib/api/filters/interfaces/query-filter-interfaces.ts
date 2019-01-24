interface RequestQueryDto {
  readonly sort_by?: string;

  readonly page: number;
  readonly per_page: number;
  readonly last_id?: string;

  readonly include?: string[];

  readonly included_query?: {
      [index: string]: RequestQueryDto,
    }
}

interface RequestQueryComments extends RequestQueryDto {
  depth?: number;
  readonly parent_id?: number;
  readonly commentable_id?: number;
}

interface DbParamsDto {
  attributes: string[];
  where: {[index: string]: any };
  include: any[];

  limit: number;
  offset: number;
}

export {
  RequestQueryDto,
  DbParamsDto,
  RequestQueryComments,
};
