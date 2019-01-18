"use strict";
const commentsRepository = require('./../comments-repository');
const apiPostProcessor = require('../../common/service/api-post-processor');
const commentsPostProcessor = require('./comments-post-processor');
const queryFilterService = require('../../api/filters/query-filter-service');
class CommentsFetchService {
    static async findAndProcessCommentsByPostId(postId, currentUserId, query) {
        const params = queryFilterService.getQueryParametersWithRepository(query, commentsRepository);
        const [dbData, totalAmount] = await Promise.all([
            commentsRepository.findAllByCommentableId(postId, params),
            commentsRepository.countAllByCommentableId(postId, params),
        ]);
        const NEXT_COMMENTS_DEPTH_FROM_TOP = 1;
        const nextDepthTotalAmounts = await commentsRepository.countNextDepthTotalAmount(NEXT_COMMENTS_DEPTH_FROM_TOP, postId);
        commentsPostProcessor.processManyCommentMetadata(dbData, nextDepthTotalAmounts);
        const data = apiPostProcessor.processManyComments(dbData, currentUserId);
        const metadata = queryFilterService.getMetadata(totalAmount, query, params);
        return {
            data,
            metadata,
        };
    }
}
module.exports = CommentsFetchService;
