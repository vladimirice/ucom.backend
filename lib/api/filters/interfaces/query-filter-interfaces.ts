interface RequestQueryDto {
  readonly sort_by?:   string;

  readonly page?:      number;
  readonly per_page?:  number;
  readonly last_id?:   string;
}

interface DbParamsDto {
  attributes: string[];
  where: {[index: string]: any };
  include: any[];
}

export {
  RequestQueryDto,
  DbParamsDto,
};
