import { Transaction } from 'knex';
import { IRequestBody } from '../../common/interfaces/common-types';
import { BadRequestError, HttpForbiddenError } from '../../api/errors';

import EosContentInputProcessor = require('../../eos/input-processor/content/eos-content-input-processor');

import knex = require('../../../config/knex');
import UserActivityService = require('../../users/user-activity-service');
import CommentsRepository = require('../comments-repository');
import CommentToEventIdService = require('./comment-to-event-id-service');
import CommentsModelProvider = require('./comments-model-provider');
import PostsModelProvider = require('../../posts/service/posts-model-provider');

class CommentsUpdateService {
  public static async updateComment(
    commentId: number,
    body: IRequestBody,
    currentUserId: number,
  ): Promise<void> {
    EosContentInputProcessor.areSignedTransactionUpdateDetailsOrError(body);

    // #task #optimization
    const commentToUpdate = await CommentsRepository.findOnlyCommentItselfById(commentId);

    if (commentToUpdate.user_id !== currentUserId) {
      throw new HttpForbiddenError('Only author can update a comment');
    }

    const { description, entity_images } = body;

    if (!description || !entity_images) {
      throw new BadRequestError('Please provide both description and entity_images in the body');
    }

    const commentableId   = commentToUpdate.depth > 0 ? commentToUpdate.parent_id : commentToUpdate.commentable_id;
    const commentableName = commentToUpdate.depth > 0 ? CommentsModelProvider.getEntityName() : PostsModelProvider.getEntityName();

    const newActivity = await knex.transaction(async (transaction: Transaction) => {
      await transaction(CommentsModelProvider.getTableName())
        .update({
          description,
          entity_images,
        })
        .where({
          id: commentId,
          user_id: currentUserId,
        });

      const eventId: number = CommentToEventIdService.getUpdatingEventIdByPost(commentToUpdate);

      return UserActivityService.processCommentIsUpdated(
        commentId,
        currentUserId,
        eventId,
        transaction,
        body.signed_transaction,
        commentableId,
        commentableName,
      );
    });

    await UserActivityService.sendContentUpdatingPayloadToRabbitEosV2(newActivity);
  }
}

export = CommentsUpdateService;
