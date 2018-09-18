const PostTypeDictionary = require('./post-type-dictionary');
const PostRepository = require('./posts-repository');
const PostOfferRepository = require('./post-offer/post-offer-repository');
const moment = require('moment');


class PostJobSerializer {
  // Get post data and serialize it. If necessary - request for other props
  // Variant 2 - it might be done by consumer, not by producer

  // Producer message might contain only id
  // If required to add some data - just change consumer logics it is not required to stop producing

  static getPostDataToCreateJob(post) {
    const payload = {
      'id': post.id,
      'post_type_id': post.post_type_id,
      'content_type': 'post',
    };

    return JSON.stringify(payload);
  }

  static async getPostDataForIpfs(postJobPayload) {
    const postId = postJobPayload.id;
    const postTypeId = postJobPayload.post_type_id;

    const data = await PostRepository.findOneForIpfs(postId, postTypeId);

    data['created_at'] = parseInt(moment(data['created_at']).valueOf() / 1000);
    data['updated_at'] = parseInt(moment(data['updated_at']).valueOf() / 1000);

    return data;
  }
}

module.exports = PostJobSerializer;