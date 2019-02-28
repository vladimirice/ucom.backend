"use strict";
const OrganizationsToEntitiesRepository = require("../repository/organizations-to-entities-repository");
const ApiPostProcessor = require("../../common/service/api-post-processor");
class OrganizationsFetchRelated {
    static async getManyDiscussions(orgId) {
        const posts = await OrganizationsToEntitiesRepository.findManyDiscussions(orgId);
        return ApiPostProcessor.processManyPosts(posts);
    }
}
module.exports = OrganizationsFetchRelated;
