"use strict";
const errors_1 = require("../../../api/errors");
const knex = require("../../../../config/knex");
const OrganizationsDiscussionsRepository = require("../repository/organizations-discussions-repository");
const OrganizationsValidateDiscussions = require("./organizations-validate-discussions");
class OrganizationsModifyDiscussions {
    static async deleteAllDiscussions(orgModel, currentUserId) {
        await OrganizationsValidateDiscussions.validateDeleteRequest(orgModel, currentUserId);
        await OrganizationsDiscussionsRepository.deleteAllDiscussions(orgModel.id);
    }
    static async processNewDiscussionsState(orgModel, body, currentUserId) {
        if (!body.discussions) {
            throw new errors_1.BadRequestError('field "discussions" is required');
        }
        const postsIds = [];
        for (const obj of body.discussions) {
            const id = +obj.id;
            if (!id) {
                throw new errors_1.BadRequestError('Not all "discussions" objects have id field');
            }
            await OrganizationsValidateDiscussions.validateOneDiscussion(orgModel, id, currentUserId);
            if (~postsIds.indexOf(id)) {
                throw new errors_1.BadRequestError(`All discussions must be unique. Duplicate ID is found: ${id}`);
            }
            postsIds.push(id);
        }
        await knex.transaction(async (trx) => {
            await OrganizationsDiscussionsRepository.updateDiscussionsState(orgModel.id, postsIds, trx);
        });
    }
}
module.exports = OrganizationsModifyDiscussions;
