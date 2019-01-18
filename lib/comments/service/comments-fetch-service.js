"use strict";
const commentsRepository = require('./../comments-repository');
const apiPostProcessor = require('../../common/service/api-post-processor');
class CommentsFetchService {
    static async findAndProcessCommentsByPostId(postId, currentUserId) {
        const metadata = {
            page: 1,
            per_page: 10,
            has_more: false,
            total_amount: 10,
            next_depth_total_amount: 0,
        };
        const dbData = await commentsRepository.findAllByCommentableId(postId);
        const data = apiPostProcessor.processManyComments(dbData, currentUserId);
        return {
            data,
            metadata,
        };
    }
}
module.exports = CommentsFetchService;
