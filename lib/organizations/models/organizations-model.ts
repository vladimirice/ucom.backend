import { DbParamsDto } from '../../api/filters/interfaces/query-filter-interfaces';

import QueryFilterService = require('../../api/filters/query-filter-service');
import OrganizationsModelProvider = require('../service/organizations-model-provider');

const bookshelfLib = require('bookshelf');
const knex = require('../../../config/knex');

const bookshelf = bookshelfLib(knex);

const TABLE_NAME = OrganizationsModelProvider.getTableName();

// noinspection JSDeprecatedSymbols
const orgDbModel = bookshelf.Model.extend({
  tableName: TABLE_NAME,

  findAllOrgsBy(params: DbParamsDto) {
    return this.query((query) => {
      QueryFilterService.addParamsToKnexQuery(query, params);
    });
  },
});

export {
  orgDbModel,
};
