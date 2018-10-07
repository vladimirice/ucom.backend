const PostRepository = require('./posts-repository');
const moment = require('moment');
const UsersActivityRepository = require('../../lib/users/repository').Activity;
const PostModelProvider = require('./service/posts-model-provider');

class PostJobSerializer {
  // Get post data and serialize it. If necessary - request for other props
  // Variant 2 - it might be done by consumer, not by producer

  // Producer message might contain only id
  // If required to add some data - just change consumer logic it is not required to stop producing

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