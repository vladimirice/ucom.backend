"use strict";
const errors_1 = require("../../api/errors");
const OrganizationsToEntitiesRepository = require("../repository/organizations-to-entities-repository");
const knex = require("../../../config/knex");
const OrganizationsRepository = require("../repository/organizations-repository");
class OrganizationsCreatorRelated {
    static async validateOneDiscussion(orgModel, postId, currentUserId) {
        if (!postId) {
            throw new errors_1.BadRequestError('Post ID field must be a valid number');
        }
        const [isOrgMember] = await Promise.all([
            OrganizationsRepository.isOrgMember(currentUserId, orgModel.id),
        ]);
        if (!isOrgMember) {
            throw new errors_1.HttpForbiddenError('Only author of organization is able to change discussions');
        }
        // const post = PostsRepository.findOneByIdV2(postId, true);
        /* I'm an author of org or team member
          * Organization ID exists
          * this is only publication type of post
          * Posts amount is no more than 10
          * Post ID exists
      */
    }
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
