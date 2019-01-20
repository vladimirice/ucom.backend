"use strict";
const usersActivityRepository = require('../../lib/users/repository').Activity;
const postModelProvider = require('./service/posts-model-provider');
class PostJobSerializer {
    /**
     *
     * @param {Object} jobPayload
     * @return {Promise<*>}
     */
    static async getPostDataForIpfs(jobPayload) {
        const activityId = jobPayload.id;
        return usersActivityRepository.findOneByIdWithRelatedEntityForIpfs(activityId, postModelProvider.getEntityName());
    }
}
module.exports = PostJobSerializer;
