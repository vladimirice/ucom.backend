import { DbParamsDto, RequestQueryComments }
  from '../../api/filters/interfaces/query-filter-interfaces';
import { StringToNumberCollection } from '../../common/interfaces/common-types';
import { BadRequestError } from '../../api/errors';
import { DbCommentParamsDto } from '../interfaces/query-filter-interfaces';
import { CommentsListResponse } from '../interfaces/model-interfaces';

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
    const params: DbParamsDto =
      queryFilterService.getQueryParametersWithRepository(query, commentsRepository);

    const [dbData, totalAmount] = await Promise.all([
      commentsRepository.findAllByCommentableId(postId, params),
      commentsRepository.countAllByCommentableId(postId, params),
    ]);

    const NEXT_COMMENTS_DEPTH_FROM_TOP = 1;

    const nextDepthTotalAmounts: StringToNumberCollection =
      await commentsRepository.countNextDepthTotalAmount(NEXT_COMMENTS_DEPTH_FROM_TOP, postId);

    commentsPostProcessor.processManyCommentMetadata(dbData, nextDepthTotalAmounts);

    const data = apiPostProcessor.processManyComments(dbData, currentUserId);

    const metadata = queryFilterService.getMetadata(totalAmount, query, params);

    return {
      data,
      metadata,
    };
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
      await commentsRepository.countNextDepthTotalAmount(
        params.where.depth + 1,
        params.where.commentable_id,
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
