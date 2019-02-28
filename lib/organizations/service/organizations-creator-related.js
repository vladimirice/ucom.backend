"use strict";
const errors_1 = require("../../api/errors");
const OrganizationsToEntitiesRepository = require("../repository/organizations-to-entities-repository");
const knex = require("../../../config/knex");
const OrganizationsRepository = require("../repository/organizations-repository");
const PostsRepository = require("../../posts/posts-repository");
const { ContentTypeDictionary } = require('ucom-libs-social-transactions');
const allowedDiscussionsTypes = [
    ContentTypeDictionary.getTypeMediaPost(),
];
const ALLOWED_DISCUSSIONS_AMOUNT_PER_ORG = 10;
class OrganizationsCreatorRelated {
    static async validateOneDiscussion(orgModel, postId, currentUserId) {
        if (!postId) {
            throw new errors_1.BadRequestError('Post ID field must be a valid number');
        }
        const [isOrgMember, post, discussionsAmount] = await Promise.all([
            OrganizationsRepository.isOrgMember(currentUserId, orgModel.id),
            PostsRepository.findOnlyPostItselfById(postId),
            OrganizationsToEntitiesRepository.countDiscussions(orgModel.id),
        ]);
        if (discussionsAmount === ALLOWED_DISCUSSIONS_AMOUNT_PER_ORG) {
            throw new errors_1.BadRequestError(`Organization with ID ${orgModel.id} already has maximum allowed amount of discussions: ${ALLOWED_DISCUSSIONS_AMOUNT_PER_ORG}`);
        }
        if (!isOrgMember) {
            throw new errors_1.HttpForbiddenError('Only author of organization is able to change discussions');
        }
        if (post === null) {
            throw new errors_1.BadRequestError(`There is no post with ID: ${postId}`);
        }
        if (!~allowedDiscussionsTypes.indexOf(post.post_type_id)) {
            throw new errors_1.BadRequestError(`Post type ID is not allowed. Allowed types are: ${allowedDiscussionsTypes.join(', ')}`);
        }
        if (post.organization_id === null || post.organization_id !== orgModel.id) {
            throw new errors_1.BadRequestError('Post should be made by organization member');
        }
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
