"use strict";
const errors_1 = require("../../api/errors");
const OrganizationsToEntitiesRepository = require("../repository/organizations-to-entities-repository");
const knex = require("../../../config/knex");
class OrganizationsCreatorRelated {
    // @ts-ignore
    static async processNewDiscussionsState(orgModel, body, currentUserId) {
        if (!body.discussions) {
            throw new errors_1.BadRequestError('field "discussions" is required');
        }
        if (!orgModel.isAuthor(currentUserId)) {
            throw new errors_1.HttpForbiddenError('Only author of organization is able to change discussions');
        }
        const postsIds = [];
        for (const obj of body.discussions) {
            const id = +obj.id;
            if (!id) {
                throw new errors_1.BadRequestError('Not all "discussions" objects have id field');
            }
            postsIds.push(id);
        }
        await knex.transaction(async (trx) => {
            await OrganizationsToEntitiesRepository.updateDiscussionsState(orgModel.id, postsIds, trx);
        });
    }
}
module.exports = OrganizationsCreatorRelated;
