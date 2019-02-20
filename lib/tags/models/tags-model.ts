import { DbParamsDto } from '../../api/filters/interfaces/query-filter-interfaces';

import QueryFilterService = require('../../api/filters/query-filter-service');
import TagsModelProvider = require('../service/tags-model-provider');

const bookshelfLib = require('bookshelf');
const knex = require('../../../config/knex');

const bookshelf = bookshelfLib(knex);

const TABLE_NAME                = TagsModelProvider.getTableName();
const CURRENT_PARAMS_TABLE_NAME = TagsModelProvider.getCurrentParamsTableName();

// noinspection JSDeprecatedSymbols
const TagDbModel = bookshelf.Model.extend({
  tableName: TABLE_NAME,

  findAllTagsBy(params: DbParamsDto) {
    return this.query((query) => {
      QueryFilterService.processAttributes(params, TABLE_NAME);
      QueryFilterService.addParamsToKnexQuery(query, params);
      this.addCurrentParamsInnerJoin(query);
    });
  },

  addCurrentParamsInnerJoin(query) {
    // noinspection JSIgnoredPromiseFromCall // #task - use inner join instead
    query.join(CURRENT_PARAMS_TABLE_NAME, `${TABLE_NAME}.id`, '=', `${CURRENT_PARAMS_TABLE_NAME}.tag_id`);
  },
});

export {
  TagDbModel,
};
