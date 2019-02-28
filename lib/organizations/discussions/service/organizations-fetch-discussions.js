"use strict";
const ApiPostProcessor = require("../../../common/service/api-post-processor");
const OrganizationsDiscussionsRepository = require("../repository/organizations-discussions-repository");
class OrganizationsFetchDiscussions {
    static async getManyDiscussions(orgId) {
        const posts = await OrganizationsDiscussionsRepository.findManyDiscussions(orgId);
        return ApiPostProcessor.processManyPosts(posts);
    }
}
module.exports = OrganizationsFetchDiscussions;
