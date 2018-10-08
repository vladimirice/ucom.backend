const UsersActivityRepository = require('../../lib/users/repository').Activity;
const PostModelProvider = require('./service/posts-model-provider');

class PostJobSerializer {
  /**
   *
   * @param {Object} jobPayload
   * @return {Promise<*>}
   */
  static async getPostDataForIpfs(jobPayload) {
    const activityId = jobPayload.id;

    return UsersActivityRepository.findOneByIdWithRelatedEntityForIpfs(activityId, PostModelProvider.getEntityName());
  }
}

module.exports = PostJobSerializer;