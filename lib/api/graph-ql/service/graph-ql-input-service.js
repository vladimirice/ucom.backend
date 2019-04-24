"use strict";
class GraphQlInputService {
    static getQueryFromArgs(args) {
        return {
            page: args.page,
            per_page: args.per_page,
            order_by: args.order_by,
            filters: args.filters,
        };
    }
}
module.exports = GraphQlInputService;
