/* tslint:disable:max-line-length */
import { Transaction } from 'knex';
import { AppError, BadRequestError, getErrorMessagePair } from '../api/errors';
import { UserModel } from './interfaces/model-interfaces';
import { ISignedTransactionObject } from '../eos/interfaces/transactions-interfaces';
import { IActivityModel } from './interfaces/users-activity/dto-interfaces';
import { IActivityOptions } from '../eos/interfaces/activity-interfaces';
import { IRequestBody } from '../common/interfaces/common-types';

import knex = require('../../config/knex');
import UsersActivityRepository = require('./repository/users-activity-repository');
import NotificationsEventIdDictionary = require('../entities/dictionary/notifications-event-id-dictionary');
import UsersActivityFollowRepository = require('./repository/users-activity/users-activity-follow-repository');
import ActivityGroupDictionary = require('../activity/activity-group-dictionary');
import UsersModelProvider = require('./users-model-provider');
import UserActivitySerializer = require('./job/user-activity-serializer');
import ActivityProducer = require('../jobs/activity-producer');
import PostsModelProvider = require('../posts/service/posts-model-provider');
import CommentsModelProvider = require('../comments/service/comments-model-provider');

import EosTransactionService = require('../eos/eos-transaction-service');
import OrganizationsModelProvider = require('../organizations/service/organizations-model-provider');
import BlockchainModelProvider = require('../eos/service/blockchain-model-provider');

const { EventsIds } = require('ucom.libs.common').Events.Dictionary;

const status = require('statuses');

// tslint:disable-next-line:max-line-length
const { ContentTypeDictionary, InteractionTypeDictionary } = require('ucom-libs-social-transactions');

const ACTIVITY_TYPE__UPVOTE_NODE = 20;
const ACTIVITY_TYPE__CANCEL_NODE_UPVOTING_NODE = 30;

class UserActivityService {
  public static async processUserVotesChangingForBlockProducers(userId, blockchainNodeIds, transaction, eventId: number) {
    const data: any = [];

    for (const element of blockchainNodeIds) {
      data.push({
        activity_type_id:   ACTIVITY_TYPE__UPVOTE_NODE,
        activity_group_id:  ActivityGroupDictionary.getUserInteractsWithBlockchainNode(),

        user_id_from: userId,
        entity_id_to: element,

        entity_name:  BlockchainModelProvider.getEntityName(),
        event_id:     eventId,

        // Not required fields
        signed_transaction: '',
        blockchain_response: '',
        blockchain_status: 0,
        entity_id_on: null,
        entity_name_on: null,
      });
    }

    return UsersActivityRepository.bulkCreateNewActivity(data, transaction);
  }

  static async processUserCancelVotesForBlockProducers(userId, blockchainNodeIds, transaction, eventId: number) {
    const data: any = [];

    for (const element of blockchainNodeIds) {
      data.push({
        activity_type_id:   ACTIVITY_TYPE__CANCEL_NODE_UPVOTING_NODE,
        activity_group_id:  ActivityGroupDictionary.getUserInteractsWithBlockchainNode(),

        user_id_from: userId,
        entity_id_to: element,

        entity_name:  BlockchainModelProvider.getEntityName(),
        event_id:     eventId,

        // Not required fields
        signed_transaction: '',
        blockchain_response: '',
        blockchain_status: 0,
        entity_id_on: null,
        entity_name_on: null,
      });
    }

    return UsersActivityRepository.bulkCreateNewActivity(data, transaction);
  }

  public static async processNewOrganization(
    signedTransaction: string,
    currentUserId: number,
    newOrganizationId: string,
    transaction,
  ) {
    const data = {
      activity_type_id:   ContentTypeDictionary.getTypeOrganization(),
      activity_group_id:  ActivityGroupDictionary.getGroupContentCreation(),
      user_id_from:       currentUserId,
      entity_id_to:       newOrganizationId,
      entity_name:        OrganizationsModelProvider.getEntityName(),
      signed_transaction: signedTransaction,
      event_id:           EventsIds.userCreatesOrganization(),
    };

    return UsersActivityRepository.createNewActivity(data, transaction);
  }

  public static async processOrganizationUpdating(
    signedTransaction: string,
    currentUserId: number,
    newOrganizationId: number,
    transaction,
  ) {
    const data = {
      activity_type_id:   ContentTypeDictionary.getTypeOrganization(),
      activity_group_id:  ActivityGroupDictionary.getGroupContentUpdating(),
      user_id_from:       currentUserId,
      entity_id_to:       newOrganizationId,
      entity_name:        OrganizationsModelProvider.getEntityName(),
      signed_transaction: signedTransaction,
      event_id:           EventsIds.userUpdatesOrganization(),
    };

    return UsersActivityRepository.createNewActivity(data, transaction);
  }

  /**
   *
   * @param {number} currentUserId
   * @param {number} targetUserId
   * @param {number} newOrganizationId
   * @param {Object} transaction
   * @return {Promise<Object>}
   */
  static async processUsersBoardInvitation(currentUserId, targetUserId, newOrganizationId, transaction) {
    const data: any = {
      activity_type_id:   InteractionTypeDictionary.getOrgTeamInvitation(),
      activity_group_id:  ActivityGroupDictionary.getGroupUsersTeamInvitation(),
      user_id_from:       currentUserId, // who acts. Org creator
      entity_id_to:       targetUserId, // who is invited. User from usersAdded
      entity_name:        UsersModelProvider.getEntityName(), // user_entity_name

      entity_id_on:       newOrganizationId,
      entity_name_on:     OrganizationsModelProvider.getEntityName(),

      signed_transaction: '',
      event_id:           NotificationsEventIdDictionary.getOrgUsersTeamInvitation(),
    };

    return UsersActivityRepository.createNewActivity(data, transaction);
  }

  public static async createForUserVotesPost(
    activityTypeId: number,
    signedTransaction: string,
    currentUserId: number,
    postIdTo: number,
    eventId: number,
    transaction: Transaction,
  ) {
    const data = {
      activity_type_id:   activityTypeId,
      activity_group_id:  ActivityGroupDictionary.getGroupContentInteraction(),
      user_id_from:       currentUserId,
      entity_id_to:       postIdTo,
      entity_name:        PostsModelProvider.getEntityName(),
      signed_transaction: signedTransaction,

      event_id:           eventId,
    };

    return UsersActivityRepository.createNewKnexActivity(data, transaction);
  }

  public static async createForUserCreatesProfile(
    signedTransaction: ISignedTransactionObject,
    currentUserId: number,
    transaction: Transaction | null = null,
  ): Promise<IActivityModel> {
    const data = {
      user_id_from:       currentUserId,
      entity_id_to:       currentUserId,
      signed_transaction: signedTransaction,

      activity_type_id:   ActivityGroupDictionary.getUserProfile(), // type and group are the same
      activity_group_id:  ActivityGroupDictionary.getUserProfile(),

      entity_name:        UsersModelProvider.getEntityName(),
      event_id:           EventsIds.userCreatesProfile(),
    };

    return UsersActivityRepository.createNewKnexActivity(data, transaction);
  }

  public static async createForUserUpdatesProfile(
    signedTransaction: ISignedTransactionObject,
    currentUserId: number,
    transaction: any = null,
  ): Promise<IActivityModel> {
    const data = {
      user_id_from:       currentUserId,
      entity_id_to:       currentUserId,
      signed_transaction: signedTransaction,

      activity_type_id:   ActivityGroupDictionary.getUserProfile(), // type and group are the same
      activity_group_id:  ActivityGroupDictionary.getUserProfile(),

      entity_name:        UsersModelProvider.getEntityName(),
      event_id:           EventsIds.userUpdatesProfile(),
    };

    return UsersActivityRepository.createNewActivity(data, transaction);
  }

  public static async createForUserUpdatesProfileViaKnex(
    signedTransaction: ISignedTransactionObject,
    currentUserId: number,
    transaction: any = null,
  ): Promise<IActivityModel> {
    const data = {
      user_id_from:       currentUserId,
      entity_id_to:       currentUserId,
      signed_transaction: signedTransaction,

      activity_type_id:   ActivityGroupDictionary.getUserProfile(), // type and group are the same
      activity_group_id:  ActivityGroupDictionary.getUserProfile(),

      entity_name:        UsersModelProvider.getEntityName(),
      event_id:           EventsIds.userUpdatesProfile(),
    };

    return UsersActivityRepository.createNewKnexActivity(data, transaction);
  }

  public static async createForUserVotesComment(
    interactionType: number,
    signedTransaction: string,
    currentUserId: number,
    commentId: number,
    eventId: number,
    transaction: Transaction,
  ) {
    const data = {
      activity_type_id:   interactionType,
      activity_group_id:  ActivityGroupDictionary.getGroupContentInteraction(),

      user_id_from:       currentUserId,
      entity_id_to:       commentId,

      entity_name:        CommentsModelProvider.getEntityName(),
      signed_transaction: signedTransaction,

      event_id:           eventId,
    };

    return UsersActivityRepository.createNewKnexActivity(data, transaction);
  }

  public static async processOrganizationCreatesPost(
    newPost,
    eventId,
    signedTransaction,
    currentUserId,
    transaction = null,
  ) {
    const activityGroupId = ActivityGroupDictionary.getGroupContentCreationByOrganization();
    const entityName      = PostsModelProvider.getEntityName();

    const data = {
      activity_type_id:   newPost.post_type_id,
      activity_group_id:  activityGroupId,
      user_id_from:       currentUserId,
      entity_id_to:       newPost.id,
      entity_name:        entityName,
      signed_transaction: signedTransaction,
      event_id:           eventId,

      entity_id_on:       newPost.entity_id_for,
      entity_name_on:     newPost.entity_name_for,
    };

    return UsersActivityRepository.createNewActivity(data, transaction);
  }

  public static async processPostIsUpdated(
    updatedPost,
    currentUserId,
    eventId: number | null,
    transaction,
    signedTransaction = '',
  ) {
    const activityGroupId = ActivityGroupDictionary.getGroupContentUpdating();
    const entityName      = PostsModelProvider.getEntityName();

    const data = {
      activity_type_id:   updatedPost.post_type_id,
      activity_group_id:  activityGroupId,
      user_id_from:       currentUserId,
      entity_id_to:       updatedPost.id,
      entity_name:        entityName,
      event_id:           eventId,

      signed_transaction: signedTransaction,

      entity_id_on: updatedPost.entity_id_for,
      entity_name_on: updatedPost.entity_name_for,
    };

    return UsersActivityRepository.createNewActivity(data, transaction);
  }

  /**
   *
   * @param {Object} newPost
   * @param {string} signedTransaction
   * @param {number} currentUserId
   * @param {number} eventId
   * @param {Object|null} transaction
   * @return {Promise<void|Object|*>}
   */
  static async processOrganizationCreatesRepost(
    newPost,
    eventId,
    signedTransaction,
    currentUserId,
    transaction = null,
  ) {
    const activityGroupId = ActivityGroupDictionary.getGroupContentCreationByOrganization();
    const entityName      = PostsModelProvider.getEntityName();

    const entityNameOn    = PostsModelProvider.getEntityName();

    const data = {
      activity_type_id:   newPost.post_type_id,
      activity_group_id:  activityGroupId,
      user_id_from:       currentUserId,
      entity_id_to:       newPost.id,
      entity_name:        entityName,
      signed_transaction: signedTransaction,
      event_id:           eventId,

      entity_id_on:       newPost.parent_id,
      entity_name_on:     entityNameOn,
    };

    return UsersActivityRepository.createNewActivity(data, transaction);
  }

  public static async processUserHimselfCreatesPost(
    newPost,
    eventId,
    signedTransaction,
    currentUserId,
    transaction = null,
  ) {
    const activityGroupId = ActivityGroupDictionary.getGroupContentCreation();
    const entityName      = PostsModelProvider.getEntityName();

    const data = {
      activity_type_id:   newPost.post_type_id,
      activity_group_id:  activityGroupId,
      user_id_from:       currentUserId,
      entity_id_to:       newPost.id,
      entity_name:        entityName,
      signed_transaction: signedTransaction,
      event_id:           eventId,

      entity_id_on:       newPost.entity_id_for,
      entity_name_on:     newPost.entity_name_for,
    };

    return UsersActivityRepository.createNewActivity(data, transaction);
  }

  /**
   *
   * @param {number} postIdWhereMentioned
   * @param {number} userIdWhoMention
   * @param {number} mentionedUserId
   * @param {Object|null} transaction
   * @return {Promise<void|Object|*>}
   */
  static async processUserMentionOtherUserInPost(
    postIdWhereMentioned,
    userIdWhoMention,
    mentionedUserId,
    transaction = null,
  ) {
    const activityGroupId     = ActivityGroupDictionary.getGroupTagEvent();
    const postEntityName      = PostsModelProvider.getEntityName();
    const userEntityName      = UsersModelProvider.getEntityName();

    const eventId = NotificationsEventIdDictionary.getUserHasMentionedYouInPost();

    const data = {
      activity_type_id:   activityGroupId, // #task - refactor activity/group/event structure
      activity_group_id:  activityGroupId,
      user_id_from:       userIdWhoMention,
      entity_id_to:       mentionedUserId,
      entity_name:        userEntityName,
      signed_transaction: '',
      event_id:           eventId,

      entity_id_on:       postIdWhereMentioned,
      entity_name_on:     postEntityName,
    };

    return UsersActivityRepository.createNewActivity(data, transaction);
  }

  /**
   *
   * @param {number} postIdWhereMentioned
   * @param {number} userIdWhoMention
   * @param {number} mentionedUserId
   * @param {Object|null} transaction
   * @return {Promise<void|Object|*>}
   */
  static async processUserMentionOtherUserInComment(
    postIdWhereMentioned,
    userIdWhoMention,
    mentionedUserId,
    transaction = null,
  ) {
    const activityGroupId     = ActivityGroupDictionary.getGroupTagEvent();
    const entityNameOn        = CommentsModelProvider.getEntityName();
    const userEntityName      = UsersModelProvider.getEntityName();

    const eventId = NotificationsEventIdDictionary.getUserHasMentionedYouInComment();

    const data = {
      activity_type_id:   activityGroupId, // #task - refactor activity/group/event structure
      activity_group_id:  activityGroupId,
      user_id_from:       userIdWhoMention,
      entity_id_to:       mentionedUserId,
      entity_name:        userEntityName,
      signed_transaction: '',
      event_id:           eventId,

      entity_id_on:       postIdWhereMentioned,
      entity_name_on:     entityNameOn,
    };

    return UsersActivityRepository.createNewActivity(data, transaction);
  }

  /**
   *
   * @param {Object} newPost
   * @param {string} signedTransaction
   * @param {number} currentUserId
   * @param {number} eventId
   * @param {Object|null} transaction
   * @return {Promise<void|Object|*>}
   */
  public static async processUserHimselfCreatesRepost(
    newPost,
    eventId,
    signedTransaction,
    currentUserId,
    transaction = null,
  ) {
    const activityGroupId = ActivityGroupDictionary.getGroupContentCreation();
    const entityName      = PostsModelProvider.getEntityName();
    const entityNameOn    = PostsModelProvider.getEntityName();

    const data = {
      activity_type_id:   newPost.post_type_id,
      activity_group_id:  activityGroupId,
      user_id_from:       currentUserId,
      entity_id_to:       newPost.id,
      entity_name:        entityName,
      signed_transaction: signedTransaction,
      event_id:           eventId,

      entity_id_on:       newPost.parent_id,
      entity_name_on:     entityNameOn,
    };

    return UsersActivityRepository.createNewActivity(data, transaction);
  }

  /**
   *
   * @param {number} currentUserId
   * @param {number} newCommentId
   * @param {string} signedTransaction
   * @param {boolean} isOrganization
   * @param {number} commentableId
   * @param {string} commentableName
   * @param {number} eventId
   * @param {Object} transaction
   * @return {Promise<Object>}
   */
  static async processCommentCreation(
    currentUserId,
    newCommentId,
    signedTransaction,
    isOrganization,
    commentableId,
    commentableName,
    eventId,
    transaction,
  ) {
    const activityTypeId      = ContentTypeDictionary.getTypeComment();
    const commentsEntityName  = CommentsModelProvider.getEntityName();

    let activityGroupId;
    if (isOrganization) {
      activityGroupId = ActivityGroupDictionary.getGroupContentCreationByOrganization();
    } else {
      activityGroupId = ActivityGroupDictionary.getGroupContentCreation();
    }

    const data = {
      activity_type_id:   activityTypeId,
      activity_group_id:  activityGroupId,
      user_id_from:       currentUserId,
      entity_id_to:       newCommentId,
      entity_name:        commentsEntityName,
      signed_transaction: signedTransaction,

      entity_id_on:       commentableId,
      entity_name_on:     commentableName,

      event_id:           eventId,
    };

    return UsersActivityRepository.createNewActivity(data, transaction);
  }

  /**
   * @param {number | null} userId
   * @returns {Promise<Object>}
   */
  static async getUserFollowActivityData(userId: number | null = null) {
    if (userId === null) {
      return {
        IFollow: [],
        myFollowers: [],
      };
    }

    const data = await UsersActivityRepository.findOneUserFollowActivityData(userId);

    // tslint:disable-next-line:variable-name
    const IFollow: any = [];
    const myFollowers: any = [];
    data.forEach((activity) => {
      activity.entity_id_to = +activity.entity_id_to;

      if (InteractionTypeDictionary.isFollowActivity(activity)) {
        if (activity.user_id_from === userId) {
          IFollow.push(activity.entity_id_to);
        } else if (activity.entity_id_to === userId) {
          myFollowers.push(activity.user_id_from);
        }
      }
    });

    return {
      IFollow,
      myFollowers,
    };
  }

  public static async userFollowsAnotherUser(
    userFrom: UserModel,
    userIdTo: number,
    body: IRequestBody,
  ): Promise<void> {
    const activityTypeId = InteractionTypeDictionary.getFollowId();

    await this.userFollowOrUnfollowUser(userFrom, userIdTo, activityTypeId, body);
  }

  public static async userUnfollowsUser(
    userFrom: UserModel,
    userIdTo: number,
    body: IRequestBody,
  ): Promise<void> {
    const activityTypeId = InteractionTypeDictionary.getUnfollowId();

    await this.userFollowOrUnfollowUser(userFrom, userIdTo, activityTypeId, body);
  }

  private static async userFollowOrUnfollowUser(
    userFrom: UserModel,
    userIdTo: number,
    activityTypeId: number,
    body: IRequestBody,
  ) {
    await this.checkPreconditions(userFrom, userIdTo, activityTypeId);

    if (!body.signed_transaction) {
      throw new BadRequestError(getErrorMessagePair('signed_transaction', 'this field is required'));
    }

    const activity = await this.processUserFollowsOrUnfollowsUser(
      activityTypeId,
      body.signed_transaction,
      userFrom.id,
      userIdTo,
    );

    const options: IActivityOptions = EosTransactionService.getEosVersionBasedOnSignedTransaction(
      body.signed_transaction,
    );

    await UserActivityService.sendPayloadToRabbitWithOptions(activity, options);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<void>}
   */
  static async sendPayloadToRabbit(activity: IActivityModel) {
    const jsonPayload = UserActivitySerializer.getActivityDataToCreateJob(activity.id);

    await ActivityProducer.publishWithUserActivity(jsonPayload);
  }

  public static async sendPayloadToRabbitWithEosVersion(activity: IActivityModel, signedTransaction: string) {
    const options: IActivityOptions =
      EosTransactionService.getEosVersionBasedOnSignedTransaction(signedTransaction);

    this.sendPayloadToRabbitWithOptions(activity, options);
  }

  public static async sendPayloadToRabbitEosV2(activity: IActivityModel): Promise<void> {
    const jsonPayload: string =
      UserActivitySerializer.createJobWithOnlyEosJsV2Option(activity.id);

    await ActivityProducer.publishWithUserActivity(jsonPayload);
  }

  static async sendContentCreationPayloadToRabbit(activity) {
    const jsonPayload = UserActivitySerializer.getActivityDataToCreateJob(activity.id);

    await ActivityProducer.publishWithContentCreation(jsonPayload);
  }


  public static async sendContentCreationPayloadToRabbitWithEosVersion(
    activity: IActivityModel,
    signedTransactions: string,
  ): Promise<void> {
    const options: IActivityOptions =
      EosTransactionService.getEosVersionBasedOnSignedTransaction(signedTransactions);

    this.sendContentCreationPayloadToRabbitWithOptions(activity, options);
  }


  public static async sendPayloadToRabbitWithOptions(
    activity: IActivityModel,
    options: IActivityOptions,
  ): Promise<void> {
    const jsonPayload = UserActivitySerializer.createJobWithOptions(activity.id, options);

    await ActivityProducer.publishWithUserActivity(jsonPayload);
  }

  public static async sendContentUpdatingPayloadToRabbitEosV2(
    activity: IActivityModel,
  ): Promise<void> {
    const jsonPayload: string =
      UserActivitySerializer.createJobWithOnlyEosJsV2Option(activity.id);

    await ActivityProducer.publishWithContentUpdating(jsonPayload);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} userIdTo
   * @param {number} activityTypeId
   * @returns {Promise<void>}
   * @private
   */
  private static async checkPreconditions(userFrom, userIdTo, activityTypeId) {
    if (userFrom.id === userIdTo) {
      throw new BadRequestError({
        general: 'It is not possible to follow yourself',
      },                        status('400'));
    }

    const currentFollowActivity = await UsersActivityRepository.getLastFollowOrUnfollowActivityForUser(userFrom.id, userIdTo);
    const currentFollowStatus = currentFollowActivity ? currentFollowActivity.activity_type_id : null;

    if (currentFollowStatus && currentFollowActivity.activity_type_id === activityTypeId) {
      throw new BadRequestError({
        general: 'It is not possible to follow/unfollow twice',
      },                        status('400'));
    }

    if (!InteractionTypeDictionary.isOppositeActivityRequired(activityTypeId)) {
      return;
    }

    if (!currentFollowStatus || currentFollowStatus !== InteractionTypeDictionary.getOppositeFollowActivityTypeId(activityTypeId)) {
      throw new BadRequestError({
        general: 'It is not possible to unfollow before follow',
      },                        status('400'));
    }
  }

  private static async processUserFollowsOrUnfollowsUser(
    activityTypeId: number,
    signedTransaction: string,
    currentUserId: number,
    userIdTo: number,
  ): Promise<any> {
    const activityGroupId = ActivityGroupDictionary.getGroupUserUserInteraction();
    const entityName      = UsersModelProvider.getEntityName();
    const eventId         = activityTypeId === InteractionTypeDictionary.getFollowId() ?
      NotificationsEventIdDictionary.getUserFollowsYou() : NotificationsEventIdDictionary.getUserUnfollowsYou();

    return knex.transaction(async (trx) => {
      await this.createFollowIndex(eventId, currentUserId, userIdTo, trx);

      const data = {
        activity_type_id: activityTypeId,
        activity_group_id: activityGroupId,
        user_id_from: currentUserId,
        entity_id_to: userIdTo,
        entity_name: entityName,
        signed_transaction: signedTransaction,

        event_id: eventId,
      };

      return UsersActivityRepository.createNewKnexActivity(data, trx);
    });
  }

  private static async createFollowIndex(
    eventId: number,
    userIdFrom: number,
    userIdTo: number,
    trx: Transaction,
  ): Promise<void> {
    if (NotificationsEventIdDictionary.doesUserFollowOtherUser(eventId)) {
      await UsersActivityFollowRepository.insertOneFollowsOtherUser(userIdFrom, userIdTo, trx);

      return;
    }

    if (NotificationsEventIdDictionary.doesUserUnfollowOtherUser(eventId)) {
      const deleteRes = await UsersActivityFollowRepository.deleteOneFollowsOtherUser(userIdFrom, userIdTo, trx);
      if (deleteRes === null) {
        throw new AppError(`No record to delete. It is possible that it is a concurrency issue. User ID from: ${userIdFrom}, user ID to ${userIdTo}`);
      }

      return;
    }

    throw new AppError(`Unsupported eventId: ${eventId}`);
  }

  private static async sendContentCreationPayloadToRabbitWithOptions(
    activity: IActivityModel,
    options: IActivityOptions,
  ): Promise<void> {
    const jsonPayload = UserActivitySerializer.createJobWithOptions(activity.id, options);

    await ActivityProducer.publishWithContentCreation(jsonPayload);
  }
}

export = UserActivityService;
