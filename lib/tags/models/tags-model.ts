import { DbParamsDto } from '../../api/filters/interfaces/query-filter-interfaces';

import QueryFilterService = require('../../api/filters/query-filter-service');
import TagsModelProvider = require('../service/tags-model-provider');

const bookshelfLib = require('bookshelf');
const knex = require('../../../config/knex');

const bookshelf = bookshelfLib(knex);

// noinspection JSDeprecatedSymbols
const TagDbModel = bookshelf.Model.extend({
  tableName: TagsModelProvider.getTableName(),

  findAllTagsBy(params: DbParamsDto) {
    return this.query((query) => {
      QueryFilterService.addParamsToKnexQuery(query, params);
    });
  },
});

export {
  TagDbModel,
};
