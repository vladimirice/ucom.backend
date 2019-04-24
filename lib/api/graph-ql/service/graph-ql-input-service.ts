import { InputQueryDto } from '../../filters/interfaces/query-filter-interfaces';

class GraphQlInputService {
  public static getQueryFromArgs(args: any): InputQueryDto {
    return {
      page: args.page,
      per_page: args.per_page,
      order_by: args.order_by,
      filters: args.filters,
    };
  }
}

export = GraphQlInputService;
