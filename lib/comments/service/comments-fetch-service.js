"use strict";
const errors_1 = require("../../api/errors");
const ApiPostProcessor = require("../../common/service/api-post-processor");
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
        const nextDepthTotalAmounts = await commentsRepository.countNextDepthTotalAmounts([postId], NEXT_COMMENTS_DEPTH_FROM_TOP);
        commentsPostProcessor.processManyCommentMetadata(dbData, nextDepthTotalAmounts);
        const data = apiPostProcessor.processManyComments(dbData, currentUserId);
        const metadata = queryFilterService.getMetadata(totalAmount, query, params);
        return {
            data,
            metadata,
        };
    }
    static async findAndProcessCommentsByPostsIds(postIds, currentUserId, query) {
        const params = queryFilterService.getQueryParametersWithRepository(query, commentsRepository);
        const NEXT_COMMENTS_DEPTH_FROM_TOP = 1;
        const [idToComments, idToTotalAmount, nextDepthTotalAmounts] = await Promise.all([
            commentsRepository.findAllByManyCommentableIds(postIds, params),
            commentsRepository.countAllByCommentableIdsAndDepth(postIds, params),
            commentsRepository.countNextDepthTotalAmounts(postIds, NEXT_COMMENTS_DEPTH_FROM_TOP),
        ]);
        const idToCommentsList = {};
        for (const postId in idToComments) {
            if (!idToComments.hasOwnProperty(postId)) {
                continue;
            }
            const comments = idToComments[postId];
            commentsPostProcessor.processManyCommentMetadata(comments, nextDepthTotalAmounts);
            apiPostProcessor.processManyComments(comments, currentUserId);
            idToCommentsList[postId] = {
                // @ts-ignore #task how to describe object converting during processing above?
                data: idToComments[postId],
                metadata: queryFilterService.getMetadata(idToTotalAmount[postId], query, params),
            };
        }
        postIds.forEach((postId) => {
            if (!idToCommentsList[postId]) {
                idToCommentsList[postId] =
                    ApiPostProcessor.getEmptyListOfModels(query.page, query.per_page);
            }
        });
        return idToCommentsList;
    }
    static async findAndProcessCommentsOfComment(query, currentUserId) {
        if (query.depth === undefined) {
            throw new errors_1.BadRequestError({ depth: 'Depth parameter is required' });
        }
        const params = queryFilterService.getQueryParametersWithRepository(query, commentsRepository);
        const [dbData, totalAmount] = await Promise.all([
            commentsRepository.findAllByDbParamsDto(params),
            commentsRepository.countAllByDbParamsDto(params),
        ]);
        const nextDepthTotalAmounts = await commentsRepository.countNextDepthTotalAmounts([params.where.commentable_id], params.where.depth + 1);
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
