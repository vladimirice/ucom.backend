/* tslint:disable:max-line-length */
import { IActivityOptions } from '../eos/interfaces/activity-interfaces';
import { UserModel } from '../users/interfaces/model-interfaces';
import { PostModel } from './interfaces/model-interfaces';
import { IRequestBody } from '../common/interfaces/common-types';

import EosTransactionService = require('../eos/eos-transaction-service');
import PostsRepository = require('./posts-repository');
import NotificationsEventIdDictionary = require('../entities/dictionary/notifications-event-id-dictionary');
import UserActivityService = require('../users/user-activity-service');
import knex = require('../../config/knex');
import UsersActivityVoteRepository = require('../users/repository/users-activity/users-activity-vote-repository');

const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');
const { BadRequestError:badRequestError } = require('../api/errors');

class PostActivityService {
  public static async userUpvotesPost(
    currentUser: UserModel,
    postId: number,
    body: IRequestBody,
  ): Promise<{ current_vote: number }> {
    const interactionType = InteractionTypeDictionary.getUpvoteId();

    await this.userVotesPost(currentUser, postId, interactionType, body);

    return this.getCurrentVote(postId);
  }

  public static async userDownvotesPost(
    currentUser: UserModel,
    postId: number,
    body: IRequestBody,
  ): Promise<{ current_vote: number }> {
    const interactionType = InteractionTypeDictionary.getDownvoteId();

    await this.userVotesPost(currentUser, postId, interactionType, body);

    return this.getCurrentVote(postId);
  }

  private static async checkVotePreconditionsAndGetModelTo(
    currentUser: UserModel,
    postId: number,
    body: IRequestBody,
    interactionType: number,
  ): Promise<PostModel> {
    const doesExists = await UsersActivityVoteRepository.doesUserVotePost(currentUser.id, postId);

    if (doesExists) {
      // eslint-disable-next-line new-cap
      throw new badRequestError({
        general: 'Vote duplication is not allowed',
      });
    }

    const post: PostModel = await PostsRepository.findOneById(postId);

    if (post.user_id === currentUser.id) {
      // eslint-disable-next-line new-cap
      throw new badRequestError({
        general: 'It is not allowed to vote for your own comment',
      });
    }

    await EosTransactionService.appendSignedUserVotesContent(currentUser, body, post.blockchain_id, interactionType);

    return post;
  }

  private static async userVotesPost(
    currentUser: UserModel,
    postId: number,
    interactionType: number,
    body: IRequestBody,
  ): Promise<void> {
    const post = await this.checkVotePreconditionsAndGetModelTo(currentUser, postId, body, interactionType);

    const eventId: number = this.getEventId(interactionType, post);

    const activity = await knex.transaction(async (transaction) => {
      const [newActivity] = await Promise.all([
        UserActivityService.createForUserVotesPost(
          interactionType,
          body.signed_transaction,
          currentUser.id,
          post.id,
          eventId,
          transaction,
        ),
        PostsRepository.changeCurrentVotesByActivityType(post.id, interactionType, transaction),

        UsersActivityVoteRepository.insertOnePostVote(currentUser.id, post.id, interactionType, transaction),
      ]);

      return newActivity;
    });

    const options: IActivityOptions = EosTransactionService.getEosVersionBasedOnSignedTransaction(
      body.signed_transaction,
    );

    await UserActivityService.sendPayloadToRabbitWithOptions(activity, options);
  }

  private static getEventId(interactionType: number, modelTo: PostModel): number {
    if (interactionType === InteractionTypeDictionary.getUpvoteId()) {
      if (modelTo.organization_id) {
        return NotificationsEventIdDictionary.getUserUpvotesPostOfOrg();
      }

      return NotificationsEventIdDictionary.getUserUpvotesPostOfOtherUser();
    }

    if (interactionType === InteractionTypeDictionary.getDownvoteId()) {
      if (modelTo.organization_id) {
        return NotificationsEventIdDictionary.getUserDownvotesPostOfOrg();
      }

      return NotificationsEventIdDictionary.getUserDownvotesPostOfOtherUser();
    }

    throw new Error(`Unsupported activityTypeId: ${interactionType}`);
  }

  private static async getCurrentVote(postId: number): Promise<{ current_vote: number }>  {
    const currentVote = await PostsRepository.getPostCurrentVote(postId);

    return {
      current_vote: currentVote!,
    };
  }
}

export = PostActivityService;
