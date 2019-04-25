import { InputQueryDto } from '../../filters/interfaces/query-filter-interfaces';

import _ = require('lodash');

class GraphQlInputService {
  public static getQueryFromArgs(args: any, customQuery: any): InputQueryDto {
    const fromRequest = {
      page: args.page,
      per_page: args.per_page,
      order_by: args.order_by,
      filters: args.filters,
    };

    return _.defaultsDeep(customQuery, fromRequest);
  }
}

export = GraphQlInputService;
