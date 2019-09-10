"use strict";
const UsersModelProvider = require("../../users-model-provider");
const knex = require("../../../../config/knex");
const KnexQueryBuilderHelper = require("../../../common/helper/repository/knex-query-builder-helper");
const USERS_ACTIVITY_EVENTS_VIEW = UsersModelProvider.getUsersActivityEventsViewTableName();
class UsersActivityEventsViewRepository {
    static async getViewsCountForEntity(entity_id, entity_name) {
        const queryBuilder = knex(USERS_ACTIVITY_EVENTS_VIEW)
            .where({
            entity_id,
            entity_name,
        });
        return KnexQueryBuilderHelper.addCountToQueryBuilderAndCalculate(queryBuilder);
    }
    static async insertOneView(user_id, entity_id, entity_name, json_headers) {
        const data = {
            user_id,
            entity_id,
            entity_name,
            json_headers,
        };
        await knex(USERS_ACTIVITY_EVENTS_VIEW).insert(data);
    }
}
module.exports = UsersActivityEventsViewRepository;
