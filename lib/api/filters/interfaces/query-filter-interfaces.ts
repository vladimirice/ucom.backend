interface RequestQueryDto {
  readonly sort_by?:   string;

  readonly page:      number;
  readonly per_page:  number;
  readonly last_id?:   string;

  readonly include?: string[];
}

interface RequestQueryComments extends RequestQueryDto {
  readonly depth?: number;
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
