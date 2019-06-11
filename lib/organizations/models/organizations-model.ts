import { DbParamsDto } from '../../api/filters/interfaces/query-filter-interfaces';

import QueryFilterService = require('../../api/filters/query-filter-service');
import OrganizationsModelProvider = require('../service/organizations-model-provider');
import UsersModelProvider = require('../../users/users-model-provider');

const bookshelfLib = require('bookshelf');
const knex = require('../../../config/knex');

const bookshelf = bookshelfLib(knex);

const TABLE_NAME = OrganizationsModelProvider.getTableName();
const CURRENT_PARAMS_TABLE_NAME = OrganizationsModelProvider.getCurrentParamsTableName();
const usersActivityFollowTableName = UsersModelProvider.getUsersActivityFollowTableName();

// noinspection JSDeprecatedSymbols
const orgDbModel = bookshelf.Model.extend({
  tableName: TABLE_NAME,

  findAllOrgsBy(params: DbParamsDto) {
    return this.query((query) => {
      QueryFilterService.processAttributes(params, TABLE_NAME);
      QueryFilterService.addParamsToKnexQuery(query, params);

      query.select(knex.raw('coalesce(f.number, 0) AS number_of_followers'));


      this.addCurrentParamsLeftJoin(query);
      this.addUsersActivityLeftJoin(query, params);
    });
  },

  addUsersActivityLeftJoin(query) {
    /*
    SELECT
    id,
      f.number AS followers_with_null,
      coalesce(f.number, 0) AS followers
    from organizations
    LEFT JOIN (
      SELECT COUNT(id) as number, entity_id FROM users_activity_follow
    WHERE entity_name = 'org       '
    GROUP BY entity_id
  ) AS f
    ON organizations.id = f.entity_id

     */

    query.leftJoin(
      knex(usersActivityFollowTableName)
        .select([knex.raw('COUNT(id) AS number'), 'entity_id'])
        .where('entity_name', OrganizationsModelProvider.getEntityName())
        .groupBy('entity_id')
        .as('f'),
      `${TABLE_NAME}.id`,
      'f.entity_id',
    );
  },
  addCurrentParamsLeftJoin(query) {
    // noinspection JSIgnoredPromiseFromCall // #task - use inner join instead
    query.leftJoin(CURRENT_PARAMS_TABLE_NAME, `${TABLE_NAME}.id`, '=', `${CURRENT_PARAMS_TABLE_NAME}.organization_id`);
  },
});

export {
  orgDbModel,
};
