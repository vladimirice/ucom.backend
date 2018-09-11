const PostStatsRepository = require('./post-stats-repository');

class PostStatsService {

  /**
   *
   * @param {number} postId
   * @returns {Promise<void>}
   */
  static async incrementCommentCount(postId) {
    await PostStatsRepository.increaseField(postId, 'comments_count', 1);
  }
}

module.exports = PostStatsService;