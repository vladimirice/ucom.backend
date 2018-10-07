const UsersActivityRepository = require('../../lib/users/repository').Activity;
const PostModelProvider = require('./service/posts-model-provider');

class PostJobSerializer {
  static getPostDataToCreateJob(post) {
    const payload = {
      'id': post.id,
      'post_type_id': post.post_type_id,
      'content_type': 'post',
    };

    return JSON.stringify(payload);
  }

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