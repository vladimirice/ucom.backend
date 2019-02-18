"use strict";
const knex = require("../../../config/knex");
const TABLE_NAME = 'posts_current_params';
class PostsCurrentParamsRepository {
    static async getPostCurrentStatsByPostId(postId) {
        return knex(TABLE_NAME).where('post_id', postId);
    }
}
module.exports = PostsCurrentParamsRepository;
