import { RequestQueryComments }
  from '../../api/filters/interfaces/query-filter-interfaces';
import { NumberToNumberCollection } from '../../common/interfaces/common-types';
import { BadRequestError } from '../../api/errors';
import {
  CommentableIdToCommentsResponse,
  CommentModel,
  CommentModelResponse,
  CommentsListResponse,
  ParentIdToDbCommentCollection,
} from '../interfaces/model-interfaces';

import ApiPostProcessor = require('../../common/service/api-post-processor');
import CommentsRepository = require('../comments-repository');
import QueryFilterService = require('../../api/filters/query-filter-service');
import CommentsPostProcessor = require('./comments-post-processor');

class CommentsFetchService {
  public static async findAndProcessOneComment(
    commentId: number,
    currentUserId: number,
  ): Promise<any> {
    const comment = await CommentsRepository.findOneById(commentId);

    return ApiPostProcessor.processOneComment(comment, currentUserId);
  }


  public static async findAndProcessCommentsByPostId(
    postId: number,
    currentUserId: number | null,
    query: RequestQueryComments,
  ): Promise<CommentsListResponse> {
    const params =
      QueryFilterService.getQueryParametersWithRepository(query, CommentsRepository);

    const [dbData, totalAmount] = await Promise.all([
      CommentsRepository.findAllByCommentableId(postId, params),
      CommentsRepository.countAllByCommentableId(postId, params),
    ]);

    const NEXT_COMMENTS_DEPTH_FROM_TOP = 1;

    const nextDepthTotalAmounts: NumberToNumberCollection =
      await CommentsRepository.countNextDepthTotalAmounts([postId], NEXT_COMMENTS_DEPTH_FROM_TOP);

    CommentsPostProcessor.processManyCommentMetadata(dbData, nextDepthTotalAmounts);

    const data = ApiPostProcessor.processManyComments(dbData, currentUserId);

    const metadata = QueryFilterService.getMetadata(totalAmount, query, params);

    return {
      data,
      metadata,
    };
  }

  public static async findAndProcessCommentsByPostsIds(
    postIds: number[],
    currentUserId: number | null,
    query: RequestQueryComments,
  ): Promise<CommentableIdToCommentsResponse> {
    const params =
      QueryFilterService.getQueryParametersWithRepository(query, CommentsRepository);

    const NEXT_COMMENTS_DEPTH_FROM_TOP = 1;


    const [idToComments, idToTotalAmount, nextDepthTotalAmounts]:
          [ParentIdToDbCommentCollection, NumberToNumberCollection, NumberToNumberCollection] =
      await Promise.all([
        CommentsRepository.findAllByManyCommentableIds(postIds, params),
        // @ts-ignore
        CommentsRepository.countAllByCommentableIdsAndDepth(postIds, params),
        CommentsRepository.countNextDepthTotalAmounts(postIds, NEXT_COMMENTS_DEPTH_FROM_TOP),
      ]);

    const idToCommentsList: CommentableIdToCommentsResponse = {};

    for (const postId in idToComments) {
      if (!idToComments.hasOwnProperty(postId)) {
        continue;
      }

      const comments: CommentModel[] = idToComments[postId];
      CommentsPostProcessor.processManyCommentMetadata(comments, nextDepthTotalAmounts);
      ApiPostProcessor.processManyComments(comments, currentUserId);

      idToCommentsList[postId] = {
        // @ts-ignore #task how to describe object converting during processing above?
        data: <CommentModelResponse>idToComments[postId],
        metadata: QueryFilterService.getMetadata(idToTotalAmount[postId], query, params),
      };
    }

    postIds.forEach((postId: number) => {
      if (!idToCommentsList[postId]) {
        idToCommentsList[postId] =
          ApiPostProcessor.getEmptyListOfModels(query.page, query.per_page);
      }
    });

    return idToCommentsList;
  }

  public static async findAndProcessCommentsOfComment(
    query: RequestQueryComments,
    currentUserId: number | null,
  ) {
    if (query.depth === undefined) {
      throw new BadRequestError({ depth: 'Depth parameter is required' });
    }

    const params =
      QueryFilterService.getQueryParametersWithRepository(query, CommentsRepository);

    const [dbData, totalAmount] = await Promise.all([
      // @ts-ignore
      CommentsRepository.findAllByDbParamsDto(params),
      CommentsRepository.countAllByDbParamsDto(params),
    ]);

    const nextDepthTotalAmounts: NumberToNumberCollection =
      await CommentsRepository.countNextDepthTotalAmounts(
        [params.where.commentable_id],
        params.where.depth + 1,
      );

    CommentsPostProcessor.processManyCommentMetadata(dbData, nextDepthTotalAmounts);

    const data = ApiPostProcessor.processManyComments(dbData, currentUserId);

    const metadata = QueryFilterService.getMetadata(totalAmount, query, params);

    return {
      data,
      metadata,
    };
  }
}

export = CommentsFetchService;
