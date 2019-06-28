"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UsersModelProvider = require("../../users-model-provider");
const OrganizationsModelProvider = require("../../../organizations/service/organizations-model-provider");
const knex = require("../../../../config/knex");
const UsersActivityRepository = require("../../repository/users-activity-repository");
(async () => {
    const usersActivity = UsersModelProvider.getUsersActivityTableName();
    const orgEntityName = OrganizationsModelProvider.getEntityName();
    const userEntityName = UsersModelProvider.getEntityName();
    const usersIdsWithActivityModels = await knex(usersActivity)
        .distinct('user_id_from')
        .select('user_id_from');
    const usersIdsWithActivity = usersIdsWithActivityModels.map(item => item.user_id_from);
    for (const userId of usersIdsWithActivity) {
        const followActivity = await UsersActivityRepository.findOneUserFollowActivity(userId);
        for (const orgId of followActivity.orgIds) {
            const sql = `
            INSERT INTO users_activity_follow (user_id, entity_id, entity_name) 
            VALUES (${userId}, ${orgId}, '${orgEntityName}')
            ON CONFLICT (user_id, entity_id, entity_name) DO NOTHING;
        `;
            await knex.raw(sql);
        }
        for (const userIdToFollow of followActivity.usersIds) {
            const sql = `
            INSERT INTO users_activity_follow (user_id, entity_id, entity_name) 
            VALUES (${userId}, ${userIdToFollow}, '${userEntityName}')
            ON CONFLICT (user_id, entity_id, entity_name) DO NOTHING;
        `;
            await knex.raw(sql);
        }
    }
})();
