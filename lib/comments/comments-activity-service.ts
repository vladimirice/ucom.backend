import { BadRequestError } from '../api/errors';
import { IActivityOptions } from '../eos/interfaces/activity-interfaces';
import { UserModel } from '../users/interfaces/model-interfaces';
import { IRequestBody } from '../common/interfaces/common-types';
import { CommentModel } from './interfaces/model-interfaces';

import CommentsRepository = require('./comments-repository');
import NotificationsEventIdDictionary = require('../entities/dictionary/notifications-event-id-dictionary');
import UserActivityService = require('../users/user-activity-service');
import EosTransactionService = require('../eos/eos-transaction-service');
import ActivityUserCommentRepository = require('../activity/activity-user-comment-repository');
import knex = require('../../config/knex');
import UsersActivityVoteRepository = require('../users/repository/users-activity/users-activity-vote-repository');
import EosContentInputProcessor = require('../eos/input-processor/content/eos-content-input-processor');

const { InteractionTypesDictionary } = require('ucom.libs.common');

class CommentsActivityService {
  public static async userUpvotesComment(
    currentUser: UserModel,
    commentId: number,
    body: IRequestBody,
  ): Promise<{ current_vote: number }> {
    const interactionType = InteractionTypesDictionary.getUpvoteId();

    await this.userVotesComment(currentUser, commentId, interactionType, body);

    return this.getCurrentCommentVote(commentId);
  }

  public static async userDownvotesComment(
    currentUser: UserModel,
    commentId: number,
    body: IRequestBody,
  ): Promise<{ current_vote: number }> {
    const interactionType = InteractionTypesDictionary.getDownvoteId();

    await this.userVotesComment(currentUser, commentId, interactionType, body);

    return this.getCurrentCommentVote(commentId);
  }

  private static async preProcessCommentVoteAndGetCommentTo(
    currentUser: UserModel,
    commentId: number,
    body: IRequestBody,
  ): Promise<CommentModel> {
    const doesExists = await UsersActivityVoteRepository.doesUserVoteComment(currentUser.id, commentId);

    if (doesExists) {
      throw new BadRequestError({
        general: 'Vote duplication is not allowed',
      });
    }

    const comment = await CommentsRepository.getModel().findOne({ where: { id: commentId } });

    if (comment.user_id === currentUser.id) {
      throw new BadRequestError({
        general: 'It is not allowed to vote for your own comment',
      });
    }

    EosContentInputProcessor.isSignedTransactionOrError(body);

    return comment;
  }

  private static async userVotesComment(
    currentUser: UserModel,
    commentId: number,
    interactionType: number,
    body: IRequestBody,
  ): Promise<void> {
    const comment = await this.preProcessCommentVoteAndGetCommentTo(
      currentUser,
      commentId,
      body,
    );

    const eventId: number = this.getEventId(interactionType, comment);

    const activity = await knex.transaction(async (transaction) => {
      const [newActivity] = await Promise.all([
        UserActivityService.createForUserVotesComment(
          interactionType,
          body.signed_transaction,
          currentUser.id,
          comment.id,
          eventId,
          transaction,
        ),
        CommentsRepository.changeCurrentVotesByActivityType(comment.id, interactionType, transaction),
        UsersActivityVoteRepository.insertOneCommentVote(currentUser.id, comment.id, interactionType, transaction),
        ActivityUserCommentRepository.createNewActivity(currentUser, comment, interactionType, transaction),
      ]);

      return newActivity;
    });

    const options: IActivityOptions = EosTransactionService.getEosVersionBasedOnSignedTransaction(
      body.signed_transaction,
    );

    await UserActivityService.sendPayloadToRabbitWithOptions(activity, options);
  }

  private static getEventId(interactionType: number, modelTo: CommentModel): number {
    if (interactionType === InteractionTypesDictionary.getUpvoteId()) {
      if (modelTo.organization_id) {
        return NotificationsEventIdDictionary.getUserUpvotesCommentOfOrg();
      }

      return NotificationsEventIdDictionary.getUserUpvotesCommentOfOtherUser();
    }

    if (interactionType === InteractionTypesDictionary.getDownvoteId()) {
      if (modelTo.organization_id) {
        return NotificationsEventIdDictionary.getUserDownvotesCommentOfOrg();
      }

      return NotificationsEventIdDictionary.getUserDownvotesCommentOfOtherUser();
    }

    throw new Error(`Unsupported activityTypeId: ${interactionType}`);
  }

  private static async getCurrentCommentVote(commentId: number): Promise<{ current_vote: number }> {
    const currentVote = await CommentsRepository.getCommentCurrentVote(commentId);

    return {
      current_vote: currentVote!,
    };
  }
}

export = CommentsActivityService;
