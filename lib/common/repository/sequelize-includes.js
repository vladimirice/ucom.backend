"use strict";
const postsModelProvider = require('../../posts/service/posts-model-provider');
const usersModelProvider = require('../../users/users-model-provider');
const orgModelProvider = require('../../organizations/service/organizations-model-provider');
class SequelizeIncludes {
    /**
     *
     * @returns {string[]}
     */
    static getIncludeForPostList() {
        return [
            orgModelProvider.getIncludeForPreview(),
            usersModelProvider.getIncludeAuthorForPreview(),
            postsModelProvider.getPostsStatsInclude(),
            postsModelProvider.getPostOfferItselfInclude(),
            postsModelProvider.getParentPostInclude(),
        ];
    }
}
module.exports = SequelizeIncludes;
