// This is a new version of RequestQueryDto
interface InputQueryDto {
  readonly order_by: string;

  readonly page: number;
  readonly per_page: number;
  readonly filters: any;
}


// see InputQueryDto - this is deprecated interface
interface RequestQueryDto {
  readonly sort_by?: string;

  readonly overview_type?: string;
  readonly entity_name?: string;
  readonly page: number;
  readonly per_page: number;
  readonly last_id?: string;

  readonly include?: string[];

  readonly included_query?: {
    [index: string]: any,
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
  whereRaw?: string;
  include?: any[];

  limit: number;
  offset: number;

  orderByRaw?: string; // knex orderBy
  order?: string[][]; // sequelize orderBy
}

interface QueryFilteredRepository {
  [index: string]: any

  getOrderByRelationMap: Function;
  getAllowedOrderBy: Function;
  getDefaultListParams: Function;
  getWhereProcessor: Function;
}

export {
  InputQueryDto,
  RequestQueryDto,
  DbParamsDto,
  RequestQueryComments,
  QueryFilteredRepository,
};
