"use strict";
const postStatsRepository = require('./post-stats-repository');
class PostStatsService {
    /**
     *
     * @param   {number} postId
     * @param   {Object} transaction
     * @returns {Promise<void>}
     */
    static async incrementCommentCount(postId, transaction) {
        await postStatsRepository.increaseField(postId, 'comments_count', 1, transaction);
    }
}
module.exports = PostStatsService;
