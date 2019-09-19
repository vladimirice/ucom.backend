"use strict";
const models = require('../../../models');
const db = models.sequelize;
const postsModelProvider = require('../service/posts-model-provider');
class PostStatsRepository {
    /**
     * @deprecated
     * #task - use posts_current_params instead
     * @param postId
     * @param transaction
     */
    static async createNew(postId, transaction) {
        return this.getModel().create({
            post_id: postId,
        }, { transaction });
    }
    /**
     * @deprecated
     * #task - use posts_current_params instead
     */
    static async createNewByKnex(post_id, transaction) {
        await transaction('post_stats').insert({ post_id });
    }
    static async increaseField(postId, field, increaseBy, transaction) {
        return this.getModel().update({
            [field]: db.literal(`${field} + ${increaseBy}`),
        }, {
            transaction,
            where: {
                post_id: postId,
            },
        });
    }
    static async findOneByPostId(postId, raw) {
        return this.getModel().findOne({
            raw,
            where: {
                post_id: postId,
            },
        });
    }
    /**
     *
     * @returns {Object}
     */
    static getModel() {
        return postsModelProvider.getPostStatsModel();
    }
    /**
     *
     * @returns {string}
     */
    static getModelName() {
        return 'post_stats';
    }
}
module.exports = PostStatsRepository;
