const PostsModelProvider = require('./posts-model-provider');

class PostsPostProcessor {
  /**
   *
   * @param {Object} post
   */
  static processDirectPost(post) {
    const toExclude = PostsModelProvider.getModel().getFieldsToExcludeFromDirectPost();

    for (const field in post) {
      if (toExclude.indexOf(field) !== -1) {
        delete post[field];
      }
    }
  }

  /**
   *
   * @param {Object} post
   */
  static processPostInCommon(post) {
    const postStats = post.post_stats;

    for (const field in postStats) {
      if (post.hasOwnProperty(field)) {
        throw new Error(`Post itself has field ${field} but it must be taken from postStats`);
      }

      post[field] = postStats[field];
    }

    delete post.post_stats;
  }
}

module.exports = PostsPostProcessor;
