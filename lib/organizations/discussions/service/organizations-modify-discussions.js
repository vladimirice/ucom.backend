"use strict";
const errors_1 = require("../../../api/errors");
const OrganizationsDiscussionsRepository = require("../repository/organizations-discussions-repository");
const OrganizationsValidateDiscussions = require("./organizations-validate-discussions");
class OrganizationsModifyDiscussions {
    static async processNewDiscussionsState(orgModel, body, currentUserId) {
        const postsIds = await this.extractPostsIdsFromBody(body, orgModel, currentUserId);
        OrganizationsValidateDiscussions.throwErrorIfMaxNumberOfPostsExceeded(orgModel, postsIds.length);
        await OrganizationsDiscussionsRepository.updateDiscussionsState(orgModel.id, postsIds);
    }
    static async deleteAllDiscussions(orgModel, currentUserId) {
        await OrganizationsValidateDiscussions.validateDeleteRequest(orgModel, currentUserId);
        await OrganizationsDiscussionsRepository.deleteAllDiscussions(orgModel.id);
    }
    static async extractPostsIdsFromBody(body, orgModel, currentUserId) {
        if (!body.discussions) {
            throw new errors_1.BadRequestError('field "discussions" is required');
        }
        const postsIds = [];
        for (const obj of body.discussions) {
            const onePostId = +obj.id;
            if (!onePostId) {
                throw new errors_1.BadRequestError('Not all "discussions" objects have id field');
            }
            await OrganizationsValidateDiscussions.validateOneDiscussion(orgModel, onePostId, currentUserId);
            if (postsIds.includes(onePostId)) {
                throw new errors_1.BadRequestError(`All discussions must be unique. Duplicate ID is found: ${onePostId}`);
            }
            postsIds.push(onePostId);
        }
        return postsIds;
    }
}
module.exports = OrganizationsModifyDiscussions;
