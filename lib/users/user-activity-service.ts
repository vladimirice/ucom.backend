/* tslint:disable:max-line-length */
const status = require('statuses');
const _ = require('lodash');

const usersRepository = require('../users/users-repository');
const models = require('../../models');
const { BadRequestError } = require('../api/errors');

const usersActivityRepository = require('../users/repository').Activity;

// tslint:disable-next-line:max-line-length
const { TransactionFactory, ContentTypeDictionary, InteractionTypeDictionary } = require('ucom-libs-social-transactions');
const activityGroupDictionary = require('../activity/activity-group-dictionary');

const userActivitySerializer = require('./job/user-activity-serializer');
const activityProducer = require('../jobs/activity-producer');

const commentsModelProvider   = require('../comments/service').ModelProvider;
const postsModelProvider      = require('../posts/service').ModelProvider;
const usersModelProvider      = require('../users/service').ModelProvider;
const orgModelProvider        = require('../organizations/service').ModelProvider;
const blockchainModelProvider = require('../eos/service/blockchain-model-provider');

const eventIdDictionary = require('../entities/dictionary').EventId;

const db = models.sequelize;

const ACTIVITY_TYPE__UPVOTE_NODE = 20;
const ACTIVITY_TYPE__CANCEL_NODE_UPVOTING_NODE = 30;

class UserActivityService {

  /**
   *
   * @param {number} userId
   * @param {number[]} blockchainNodeIds
   * @param {Object} transaction
   * @return {Promise<Object>}
   */
  static async processUserVotesChangingForBlockProducers(userId, blockchainNodeIds, transaction) {
    const data: any = [];

    for (let i = 0; i < blockchainNodeIds.length; i += 1) {
      data.push({
        activity_type_id:   ACTIVITY_TYPE__UPVOTE_NODE,
        activity_group_id:  activityGroupDictionary.getUserInteractsWithBlockchainNode(),

        user_id_from: userId,
        entity_id_to: blockchainNodeIds[i],

        entity_name:  blockchainModelProvider.getEntityName(),
        event_id:     eventIdDictionary.getUserVotesForBlockchainNode(),

        // Not required fields
        signed_transaction: '',
        blockchain_response: '',
        blockchain_status: 0,
        entity_id_on: null,
        entity_name_on: null,
      });
    }

    return usersActivityRepository.bulkCreateNewActivity(data, transaction);
  }

  /**
   *
   * @param {number} userId
   * @param {number[]} blockchainNodeIds
   * @param {Object} transaction
   * @return {Promise<Object>}
   */
  static async processUserCancelVotesForBlockProducers(userId, blockchainNodeIds, transaction) {
    const data: any = [];

    for (let i = 0; i < blockchainNodeIds.length; i += 1) {
      data.push({
        activity_type_id:   ACTIVITY_TYPE__CANCEL_NODE_UPVOTING_NODE,
        activity_group_id:  activityGroupDictionary.getUserInteractsWithBlockchainNode(),

        user_id_from: userId,
        entity_id_to: blockchainNodeIds[i],

        entity_name:  blockchainModelProvider.getEntityName(),
        event_id:     eventIdDictionary.getUserCancelVoteForBlockchainNode(),

        // Not required fields
        signed_transaction: '',
        blockchain_response: '',
        blockchain_status: 0,
        entity_id_on: null,
        entity_name_on: null,
      });
    }

    return usersActivityRepository.bulkCreateNewActivity(data, transaction);
  }

  /**
   *
   * @param {string} signedTransaction
   * @param {number} currentUserId
   * @param {number} newOrganizationId
   * @param {Object} transaction
   * @return {Promise<Object>}
   */
  static async processNewOrganization(signedTransaction, currentUserId, newOrganizationId, transaction) {
    const data = {
      activity_type_id:   ContentTypeDictionary.getTypeOrganization(),
      activity_group_id:  activityGroupDictionary.getGroupContentCreation(),
      user_id_from:       currentUserId,
      entity_id_to:       newOrganizationId,
      entity_name:        orgModelProvider.getEntityName(),
      signed_transaction: signedTransaction,
    };

    return await usersActivityRepository.createNewActivity(data, transaction);
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
      activity_group_id:  activityGroupDictionary.getGroupUsersTeamInvitation(),
      user_id_from:       currentUserId, // who acts. Org creator
      entity_id_to:       targetUserId, // who is invited. User from usersAdded
      entity_name:        usersModelProvider.getEntityName(), // user_entity_name

      entity_id_on:       newOrganizationId,
      entity_name_on:     orgModelProvider.getEntityName(),

      signed_transaction: '',
      event_id:           eventIdDictionary.getOrgUsersTeamInvitation(),
    };

    return await usersActivityRepository.createNewActivity(data, transaction);
  }

  /**
   *
   * @param {number} activityTypeId
   * @param {string} signedTransaction
   * @param {number} currentUserId
   * @param {number} userIdTo
   * @param {Object} transaction
   * @return {Promise<Object>}
   */
  static async processUserFollowsOrUnfollowsUser(
    activityTypeId,
    signedTransaction,
    currentUserId,
    userIdTo,
    transaction,
  ) {
    const activityGroupId = activityGroupDictionary.getGroupUserUserInteraction();
    const entityName      = usersModelProvider.getEntityName();
    const eventId         = activityTypeId === InteractionTypeDictionary.getFollowId() ?
      eventIdDictionary.getUserFollowsYou() : eventIdDictionary.getUserUnfollowsYou();

    const data = {
      activity_type_id:   activityTypeId,
      activity_group_id:  activityGroupId,
      user_id_from:       currentUserId,
      entity_id_to:       userIdTo,
      entity_name:        entityName,
      signed_transaction: signedTransaction,

      event_id:           eventId,
    };

    return await usersActivityRepository.createNewActivity(data, transaction);
  }

  /**
   *
   * @param {number} activityTypeId
   * @param {string} signedTransaction
   * @param {number} currentUserId
   * @param {number} postIdTo
   * @param {number} eventId
   * @param {Object} transaction
   * @return {Promise<void|Object|*>}
   */
  static async createForUserVotesPost(
    activityTypeId,
    signedTransaction,
    currentUserId,
    postIdTo,
    eventId,
    transaction = null,
  ) {
    const activityGroupId = activityGroupDictionary.getGroupContentInteraction();
    const entityName      = postsModelProvider.getEntityName();

    const data = {
      activity_type_id:   activityTypeId,
      activity_group_id:  activityGroupId,
      user_id_from:       currentUserId,
      entity_id_to:       postIdTo,
      entity_name:        entityName,
      signed_transaction: signedTransaction,

      event_id:           eventId,
    };

    return usersActivityRepository.createNewActivity(data, transaction);
  }

  /**
   *
   * @param {number} activityTypeId
   * @param {string} signedTransaction
   * @param {number} currentUserId
   * @param {number} modelIdTo
   * @param {number} eventId
   * @param {Object} transaction
   * @return {Promise<void|Object|*>}
   */
  static async createForUserVotesComment(
    activityTypeId,
    signedTransaction,
    currentUserId,
    modelIdTo,
    eventId,
    transaction = null,
  ) {
    const activityGroupId = activityGroupDictionary.getGroupContentInteraction();
    const entityName      = commentsModelProvider.getEntityName();

    const data = {
      activity_type_id:   activityTypeId,
      activity_group_id:  activityGroupId,
      user_id_from:       currentUserId,
      entity_id_to:       modelIdTo,
      entity_name:        entityName,
      signed_transaction: signedTransaction,

      event_id:           eventId,
    };

    return usersActivityRepository.createNewActivity(data, transaction);
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
  static async processOrganizationCreatesPost(
    newPost,
    eventId,
    signedTransaction,
    currentUserId,
    transaction = null,
  ) {

    const activityGroupId = activityGroupDictionary.getGroupContentCreationByOrganization();
    const entityName      = postsModelProvider.getEntityName();

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

    return await usersActivityRepository.createNewActivity(data, transaction);
  }

  /**
   *
   * @param {Object} updatedPost
   * @param {number} currentUserId
   * @param {Object} transaction
   * @returns {Promise<Object>}
   */
  static async processPostIsUpdated(
    updatedPost,
    currentUserId,
    transaction,
  ) {

    const activityGroupId = activityGroupDictionary.getGroupContentUpdating();
    const entityName      = postsModelProvider.getEntityName();

    const data = {
      activity_type_id:   updatedPost.post_type_id,
      activity_group_id:  activityGroupId,
      user_id_from:       currentUserId,
      entity_id_to:       updatedPost.id,
      entity_name:        entityName,

      signed_transaction: '',
    };

    return await usersActivityRepository.createNewActivity(data, transaction);
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

    const activityGroupId = activityGroupDictionary.getGroupContentCreationByOrganization();
    const entityName      = postsModelProvider.getEntityName();

    const entityNameOn    = postsModelProvider.getEntityName();

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

    return await usersActivityRepository.createNewActivity(data, transaction);
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
  static async processUserHimselfCreatesPost(
    newPost,
    eventId,
    signedTransaction,
    currentUserId,
    transaction = null,
  ) {

    const activityGroupId = activityGroupDictionary.getGroupContentCreation();
    const entityName      = postsModelProvider.getEntityName();

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

    return await usersActivityRepository.createNewActivity(data, transaction);
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

    const activityGroupId     = activityGroupDictionary.getGroupTagEvent();
    const postEntityName      = postsModelProvider.getEntityName();
    const userEntityName      = usersModelProvider.getEntityName();

    const eventId = eventIdDictionary.getUserHasMentionedYouInPost();

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

    return await usersActivityRepository.createNewActivity(data, transaction);
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

    const activityGroupId     = activityGroupDictionary.getGroupTagEvent();
    const entityNameOn        = commentsModelProvider.getEntityName();
    const userEntityName      = usersModelProvider.getEntityName();

    const eventId = eventIdDictionary.getUserHasMentionedYouInComment();

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

    return await usersActivityRepository.createNewActivity(data, transaction);
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
  static async processUserHimselfCreatesRepost(
    newPost,
    eventId,
    signedTransaction,
    currentUserId,
    transaction = null,
  ) {

    const activityGroupId = activityGroupDictionary.getGroupContentCreation();
    const entityName      = postsModelProvider.getEntityName();
    const entityNameOn    = postsModelProvider.getEntityName();

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

    return await usersActivityRepository.createNewActivity(data, transaction);
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
    const commentsEntityName  = commentsModelProvider.getEntityName();

    let activityGroupId;
    if (isOrganization) {
      activityGroupId = activityGroupDictionary.getGroupContentCreationByOrganization();
    } else {
      activityGroupId = activityGroupDictionary.getGroupContentCreation();
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

    return await usersActivityRepository.createNewActivity(data, transaction);
  }

  /**
   * @param {number | null} userId
   * @returns {Promise<Object>}
   */
  static async getUserActivityData(userId = null) {
    if (userId === null) {
      return {
        IFollow: [],
        myFollowers: [],
      };
    }

    const data = await usersActivityRepository.findOneUserActivityData(userId);

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

  /**
   * @param {Object} userFrom
   * @param {number} userIdTo
   * @param {Object} body
   * @returns {Promise<void>} created activity model
   */
  static async userFollowsAnotherUser(userFrom, userIdTo, body) {
    const activityTypeId = InteractionTypeDictionary.getFollowId();

    await this.userFollowOrUnfollowUser(userFrom, userIdTo, activityTypeId, body);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} userIdTo
   * @param {Object} body
   * @returns {Promise<Object>}
   */
  static async userUnfollowsUser(userFrom, userIdTo, body) {
    const activityTypeId = InteractionTypeDictionary.getUnfollowId();

    return await this.userFollowOrUnfollowUser(userFrom, userIdTo, activityTypeId, body);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {string} newOrganizationBlockchainId
   * @return {Promise<Object>}
   */
  static async createAndSignOrganizationCreationTransaction(userFrom, newOrganizationBlockchainId) {
    // noinspection JSUnresolvedFunction
    return await TransactionFactory.createSignedUserCreatesOrganization(
      userFrom.account_name,
      userFrom.private_key,
      newOrganizationBlockchainId,
    );
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} userIdTo
   * @param {number} activityTypeId
   * @param {Object} body
   * @returns {Promise<boolean>}
   * @private
   */
  private static async userFollowOrUnfollowUser(userFrom, userIdTo, activityTypeId, body) {
    // TODO - different current state logic in order to check follow requirements
    await this.checkPreconditions(userFrom, userIdTo, activityTypeId);

    const userToAccountName = await usersRepository.findAccountNameById(userIdTo);

    const activity = await db
      .transaction(async (transaction) => {
        let signed = null;
        if (body && !_.isEmpty(body) && body.signed_transaction) {
          signed = body.signed_transaction;
        } else {
          signed = await this.getSignedFollowTransaction(
            userFrom, userToAccountName, activityTypeId,
          );
        }

        return await this.processUserFollowsOrUnfollowsUser(
          activityTypeId,
          signed,
          userFrom.id,
          userIdTo,
          transaction,
        );
      });

    await this.sendPayloadToRabbit(activity);

    return true;
  }

  private static async getSignedFollowTransaction(userFrom, userToAccountName, activityTypeId) {
    return await TransactionFactory._getSignedUserToUser(
      userFrom.account_name,
      userFrom.private_key,
      userToAccountName,
      activityTypeId,
    );
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<void>}
   */
  static async sendPayloadToRabbit(activity) {
    const jsonPayload = userActivitySerializer.getActivityDataToCreateJob(activity.id);

    await activityProducer.publishWithUserActivity(jsonPayload);
  }

  static async sendContentCreationPayloadToRabbit(activity) {
    const jsonPayload = userActivitySerializer.getActivityDataToCreateJob(activity.id);

    await activityProducer.publishWithContentCreation(jsonPayload);
  }

  /**
   *
   * @param {Object} activity
   * @returns {Promise<void>}
   */
  static async sendContentUpdatingPayloadToRabbit(activity) {
    const jsonPayload = userActivitySerializer.getActivityDataToCreateJob(activity.id);

    await activityProducer.publishWithContentUpdating(jsonPayload);
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

    const currentFollowActivity = await usersActivityRepository.getLastFollowOrUnfollowActivityForUser(userFrom.id, userIdTo);
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
}

export = UserActivityService;
