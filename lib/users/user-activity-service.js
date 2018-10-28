const status = require('statuses');
const _ = require('lodash');

const UsersRepository = require('../users/users-repository');
const models = require('../../models');
const {BadRequestError} = require('../api/errors');

const UsersActivityRepository = require('../users/repository').Activity;

const { TransactionFactory, ContentTypeDictionary, InteractionTypeDictionary } = require('uos-app-transaction');
const ActivityGroupDictionary = require('../activity/activity-group-dictionary');

const UserActivitySerializer = require('./job/user-activity-serializer');
const ActivityProducer = require('../jobs/activity-producer');
const winston = require('../../config/winston');

const CommentsModelProvider = require('../comments/service').ModelProvider;
const PostsModelProvider    = require('../posts/service').ModelProvider;
const UsersModelProvider    = require('../users/service').ModelProvider;
const OrgModelProvider      = require('../organizations/service').ModelProvider;

const EventIdDictionary = require('../entities/dictionary').EventId;

const db = models.sequelize;

class UserActivityService {

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
      activity_type_id: ContentTypeDictionary.getTypeOrganization(),
      activity_group_id: ActivityGroupDictionary.getGroupContentCreation(),
      user_id_from: currentUserId,
      entity_id_to: newOrganizationId,
      entity_name: 'organizations',
      signed_transaction: signedTransaction,
    };

    return await UsersActivityRepository.createNewActivity(data, transaction);
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
      const data = {
        activity_type_id:   InteractionTypeDictionary.getOrgTeamInvitation(),
        activity_group_id:  ActivityGroupDictionary.getGroupUsersTeamInvitation(),
        user_id_from:       currentUserId, // who acts. Org creator
        entity_id_to:       targetUserId, // who is invited. User from usersAdded
        entity_name:        UsersModelProvider.getEntityName(), // user_entity_name

        entity_id_on:       newOrganizationId,
        entity_name_on:     OrgModelProvider.getEntityName(),

        signed_transaction: '',
        event_id:           EventIdDictionary.getOrgUsersTeamInvitation(),
      };

    return await UsersActivityRepository.createNewActivity(data, transaction);
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
    transaction
  ) {
    const activityGroupId = ActivityGroupDictionary.getGroupUserUserInteraction();
    const entityName      = UsersModelProvider.getEntityName();
    const eventId         = activityTypeId === InteractionTypeDictionary.getFollowId() ?
      EventIdDictionary.getUserFollowsYou() : EventIdDictionary.getUserUnfollowsYou();

    const data = {
      activity_type_id:   activityTypeId,
      activity_group_id:  activityGroupId,
      user_id_from:       currentUserId,
      entity_id_to:       userIdTo,
      entity_name:        entityName,
      signed_transaction: signedTransaction,

      event_id:           eventId,
    };

    return await UsersActivityRepository.createNewActivity(data, transaction);
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
    transaction = null
  ) {
    const activityGroupId = ActivityGroupDictionary.getGroupContentInteraction();
    const entityName      = PostsModelProvider.getEntityName();

    const data = {
      activity_type_id:   activityTypeId,
      activity_group_id:  activityGroupId,
      user_id_from:       currentUserId,
      entity_id_to:       postIdTo,
      entity_name:        entityName,
      signed_transaction: signedTransaction,

      event_id:           eventId,
    };

    return await UsersActivityRepository.createNewActivity(data, transaction);
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
    transaction = null
  ) {
    const activityGroupId = ActivityGroupDictionary.getGroupContentInteraction();
    const entityName      = CommentsModelProvider.getEntityName();

    const data = {
      activity_type_id:   activityTypeId,
      activity_group_id:  activityGroupId,
      user_id_from:       currentUserId,
      entity_id_to:       modelIdTo,
      entity_name:        entityName,
      signed_transaction: signedTransaction,

      event_id:           eventId,
    };

    return await UsersActivityRepository.createNewActivity(data, transaction);
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
    transaction = null
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

    return await UsersActivityRepository.createNewActivity(data, transaction);
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
    transaction = null
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

    return await UsersActivityRepository.createNewActivity(data, transaction);
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
    transaction
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

    return await UsersActivityRepository.createNewActivity(data, transaction);
  }

  /**
   * @param {number | null} user_id
   * @returns {Promise<Array[]>}
   */
  static async getUserActivityData(user_id = null) {
    if (user_id === null) {
      return {
        IFollow: [],
        myFollowers: [],
      }
    }

    const data = await UsersActivityRepository.findOneUserActivityData(user_id);

    let IFollow = [];
    let myFollowers = [];
    data.forEach(activity => {
      activity.entity_id_to = +activity.entity_id_to;

      if (InteractionTypeDictionary.isFollowActivity(activity)) {
        if (activity.user_id_from === user_id) {
          IFollow.push(activity.entity_id_to);
        } else if (activity.entity_id_to === user_id) {
          myFollowers.push(activity.user_id_from);
        }
      }
    });

    return {
      IFollow,
      myFollowers
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

    await this._userFollowOrUnfollowUser(userFrom,userIdTo, activityTypeId, body);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} userIdTo
   * @param {Object} body
   * @returns {Promise<Object>}
   */
  static async userUnfollowsUser(userFrom, userIdTo, body) {
    const activity_type_id = InteractionTypeDictionary.getUnfollowId();

    return await this._userFollowOrUnfollowUser(userFrom, userIdTo, activity_type_id, body);
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
      newOrganizationBlockchainId
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
  static async _userFollowOrUnfollowUser(userFrom, userIdTo, activityTypeId, body) {
    // TODO - different current state logic in order to check follow requirements
    await this._checkPreconditions(userFrom, userIdTo, activityTypeId);

    const userToAccountName = await UsersRepository.findAccountNameById(userIdTo);

    const activity = await db
      .transaction(async transaction => {
        let signed = null;
        if (body && !_.isEmpty(body) && body.signed_transaction) {
          winston.info(`signed is got from request body`);
          signed = body.signed_transaction;
          winston.info(`success, signed is: ${signed}`);
        } else {
            // noinspection JSUnresolvedFunction
            winston.info('signed is got from backend');

            signed = await this._getSignedFollowTransaction(
              userFrom, userToAccountName, activityTypeId
            );
        }

        return await this.processUserFollowsOrUnfollowsUser(
          activityTypeId,
          signed,
          userFrom.id,
          userIdTo,
          transaction
        );
      });

    await this.sendPayloadToRabbit(activity);

    return true;
  }

  static async _getSignedFollowTransaction(userFrom, userToAccountName, activityTypeId) {
    return await TransactionFactory._getSignedUserToUser(
      userFrom.account_name,
      userFrom.private_key,
      userToAccountName,
      activityTypeId
    );
  }

  /**
   * @deprecated
   * @see sendPayloadToRabbit
   *
   * @param {Object} activity
   * @param {string} scope
   * @return {Promise<void>}
   * @private
   */
  static async _sendPayloadToRabbit(activity, scope) {
    const jsonPayload = UserActivitySerializer.getActivityDataToCreateJob(activity.id, scope);

    await ActivityProducer.publishWithUserActivity(jsonPayload);
  }

  /**
   *
   * @param {Object} activity
   * @return {Promise<void>}
   */
  static async sendPayloadToRabbit(activity) {
    const jsonPayload = UserActivitySerializer.getActivityDataToCreateJob(activity.id, 'users_activity');

    await ActivityProducer.publishWithUserActivity(jsonPayload);
  }

  static async sendContentCreationPayloadToRabbit(activity) {
    const jsonPayload = UserActivitySerializer.getActivityDataToCreateJob(activity.id, 'users_activity');

    await ActivityProducer.publishWithContentCreation(jsonPayload);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} userIdTo
   * @param {number} activityTypeId
   * @returns {Promise<void>}
   * @private
   */
  static async _checkPreconditions(userFrom, userIdTo, activityTypeId) {
    if (userFrom.id === userIdTo) {
      throw new BadRequestError({
        'general': 'It is not possible to follow yourself'
      }, status('400'));
    }

    const currentFollowActivity = await UsersActivityRepository.getLastFollowOrUnfollowActivityForUser(userFrom.id, userIdTo);
    const currentFollowStatus = currentFollowActivity ? currentFollowActivity.activity_type_id : null;

    if (currentFollowStatus && currentFollowActivity.activity_type_id === activityTypeId) {
      throw new BadRequestError({
        'general': 'It is not possible to follow/unfollow twice'
      }, status('400'));
    }

    if (!InteractionTypeDictionary.isOppositeActivityRequired(activityTypeId)) {
      return;
    }

    if (!currentFollowStatus || currentFollowStatus !== InteractionTypeDictionary.getOppositeFollowActivityTypeId(activityTypeId)) {
      throw new BadRequestError({
        'general': 'It is not possible to unfollow before follow'
      }, status('400'));
    }
  }
}

module.exports = UserActivityService;