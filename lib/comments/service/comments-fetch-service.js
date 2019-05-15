"use strict";
const errors_1 = require("../../api/errors");
const ApiPostProcessor = require("../../common/service/api-post-processor");
const CommentsRepository = require("../comments-repository");
const QueryFilterService = require("../../api/filters/query-filter-service");
const CommentsPostProcessor = require("./comments-post-processor");
class CommentsFetchService {
    static async findAndProcessOneComment(commentId, currentUserId) {
        const comment = await CommentsRepository.findOneById(commentId);
        return ApiPostProcessor.processOneComment(comment, currentUserId);
    }
    static async findAndProcessCommentsByPostId(postId, currentUserId, query) {
        const params = QueryFilterService.getQueryParametersWithRepository(query, CommentsRepository);
        const [dbData, totalAmount] = await Promise.all([
            CommentsRepository.findAllByCommentableId(postId, params),
            CommentsRepository.countAllByCommentableId(postId, params),
        ]);
        const NEXT_COMMENTS_DEPTH_FROM_TOP = 1;
        const nextDepthTotalAmounts = await CommentsRepository.countNextDepthTotalAmounts([postId], NEXT_COMMENTS_DEPTH_FROM_TOP);
        CommentsPostProcessor.processManyCommentMetadata(dbData, nextDepthTotalAmounts);
        const data = ApiPostProcessor.processManyComments(dbData, currentUserId);
        const metadata = QueryFilterService.getMetadata(totalAmount, query, params);
        return {
            data,
            metadata,
        };
    }
    static async findAndProcessCommentsByPostsIds(postIds, currentUserId, query) {
        const params = QueryFilterService.getQueryParametersWithRepository(query, CommentsRepository);
        const NEXT_COMMENTS_DEPTH_FROM_TOP = 1;
        const [idToComments, idToTotalAmount, nextDepthTotalAmounts] = await Promise.all([
            CommentsRepository.findAllByManyCommentableIds(postIds, params),
            // @ts-ignore
            CommentsRepository.countAllByCommentableIdsAndDepth(postIds, params),
            CommentsRepository.countNextDepthTotalAmounts(postIds, NEXT_COMMENTS_DEPTH_FROM_TOP),
        ]);
        const idToCommentsList = {};
        for (const postId in idToComments) {
            if (!idToComments.hasOwnProperty(postId)) {
                continue;
            }
            const comments = idToComments[postId];
            CommentsPostProcessor.processManyCommentMetadata(comments, nextDepthTotalAmounts);
            ApiPostProcessor.processManyComments(comments, currentUserId);
            idToCommentsList[postId] = {
                // @ts-ignore #task how to describe object converting during processing above?
                data: idToComments[postId],
                metadata: QueryFilterService.getMetadata(idToTotalAmount[postId], query, params),
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
        const params = QueryFilterService.getQueryParametersWithRepository(query, CommentsRepository);
        const [dbData, totalAmount] = await Promise.all([
            // @ts-ignore
            CommentsRepository.findAllByDbParamsDto(params),
            CommentsRepository.countAllByDbParamsDto(params),
        ]);
        const nextDepthTotalAmounts = await CommentsRepository.countNextDepthTotalAmounts([params.where.commentable_id], params.where.depth + 1);
        CommentsPostProcessor.processManyCommentMetadata(dbData, nextDepthTotalAmounts);
        const data = ApiPostProcessor.processManyComments(dbData, currentUserId);
        const metadata = QueryFilterService.getMetadata(totalAmount, query, params);
        return {
            data,
            metadata,
        };
    }
}
module.exports = CommentsFetchService;
