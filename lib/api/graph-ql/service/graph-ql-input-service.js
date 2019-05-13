"use strict";
const _ = require("lodash");
class GraphQlInputService {
    static getQueryFromArgs(args, customQuery = {}) {
        const fromRequest = {
            page: args.page,
            per_page: args.per_page,
            order_by: args.order_by,
            filters: args.filters,
        };
        return _.defaultsDeep(customQuery, fromRequest);
    }
}
module.exports = GraphQlInputService;
