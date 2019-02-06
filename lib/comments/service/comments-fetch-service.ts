import { RequestQueryComments }
  from '../../api/filters/interfaces/query-filter-interfaces';
import { NumberToNumberCollection, StringToNumberCollection } from '../../common/interfaces/common-types';
import { BadRequestError } from '../../api/errors';
import { DbCommentParamsDto } from '../interfaces/query-filter-interfaces';
import {
  CommentableIdToCommentsResponse,
  CommentModel,
  CommentModelResponse,
  CommentsListResponse,
  ParentIdToDbCommentCollection,
} from '../interfaces/model-interfaces';

import ApiPostProcessor = require('../../common/service/api-post-processor');

const commentsRepository = require('./../comments-repository');
const apiPostProcessor = require('../../common/service/api-post-processor');
const commentsPostProcessor = require('./comments-post-processor');

const queryFilterService = require('../../api/filters/query-filter-service');

class CommentsFetchService {
  public static async findAndProcessCommentsByPostId(
    postId: number,
    currentUserId: number | null,
    query: RequestQueryComments,
  ): Promise<CommentsListResponse> {
    const params: DbCommentParamsDto =
      queryFilterService.getQueryParametersWithRepository(query, commentsRepository);

    const [dbData, totalAmount] = await Promise.all([
      commentsRepository.findAllByCommentableId(postId, params),
      commentsRepository.countAllByCommentableId(postId, params),
    ]);

    const NEXT_COMMENTS_DEPTH_FROM_TOP = 1;

    const nextDepthTotalAmounts: StringToNumberCollection =
      await commentsRepository.countNextDepthTotalAmounts([postId], NEXT_COMMENTS_DEPTH_FROM_TOP);

    commentsPostProcessor.processManyCommentMetadata(dbData, nextDepthTotalAmounts);

    const data = apiPostProcessor.processManyComments(dbData, currentUserId);

    const metadata = queryFilterService.getMetadata(totalAmount, query, params);

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
    const params: DbCommentParamsDto =
      queryFilterService.getQueryParametersWithRepository(query, commentsRepository);

    const NEXT_COMMENTS_DEPTH_FROM_TOP = 1;

    const [idToComments, idToTotalAmount, nextDepthTotalAmounts]:
          [ParentIdToDbCommentCollection, NumberToNumberCollection, NumberToNumberCollection] =
      await Promise.all([
        commentsRepository.findAllByManyCommentableIds(postIds, params),
        commentsRepository.countAllByCommentableIdsAndDepth(postIds, params),
        commentsRepository.countNextDepthTotalAmounts(postIds, NEXT_COMMENTS_DEPTH_FROM_TOP),
      ]);

    const idToCommentsList: CommentableIdToCommentsResponse = {};

    for (const postId in idToComments) {
      if (!idToComments.hasOwnProperty(postId)) {
        continue;
      }

      const comments: CommentModel[] = idToComments[postId];
      commentsPostProcessor.processManyCommentMetadata(comments, nextDepthTotalAmounts);
      apiPostProcessor.processManyComments(comments, currentUserId);

      idToCommentsList[postId] = {
        // @ts-ignore #task how to describe object converting during processing above?
        data: <CommentModelResponse>idToComments[postId],
        metadata: queryFilterService.getMetadata(idToTotalAmount[postId], query, params),
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

    const params: DbCommentParamsDto =
      queryFilterService.getQueryParametersWithRepository(query, commentsRepository);

    const [dbData, totalAmount] = await Promise.all([
      commentsRepository.findAllByDbParamsDto(params),
      commentsRepository.countAllByDbParamsDto(params),
    ]);

    const nextDepthTotalAmounts: StringToNumberCollection =
      await commentsRepository.countNextDepthTotalAmounts(
        [params.where.commentable_id],
        params.where.depth + 1,
      );

    commentsPostProcessor.processManyCommentMetadata(dbData, nextDepthTotalAmounts);

    const data = apiPostProcessor.processManyComments(dbData, currentUserId);

    const metadata = queryFilterService.getMetadata(totalAmount, query, params);

    return {
      data,
      metadata,
    };
  }
}

export = CommentsFetchService;
