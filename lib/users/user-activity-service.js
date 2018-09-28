const status = require('statuses');

const UsersRepository = require('../users/users-repository');
const ActivityUserUserRepository = require('./activity-user-user-repository');
const ActivityDictionary = require('../activity/activity-types-dictionary');
const models = require('../../models');
const {BadRequestError} = require('../api/errors');

const { TransactionFactory, ContentTypeDictionary } = require('uos-app-transaction');
const ActivityGroupDictionary = require('../activity/activity-group-dictionary');

const UserActivitySerializer = require('./job/user-activity-serializer');
const ActivityProducer = require('../jobs/activity-producer');
const UsersActivityRepository = require('../users/repository').Activity;
const winston = require('../../config/winston');

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
    // noinspection JSUnresolvedFunction
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


  // noinspection OverlyComplexFunctionJS
  static async processOrganizationCreatesPost(
    postTypeId,
    signedTransaction,
    currentUserId,
    organizationId,
    newContentId,
    transaction = null
  ) {
    const data = {
      activity_type_id:   postTypeId,
      activity_group_id:  ActivityGroupDictionary.getGroupContentCreationByOrganization(),
      user_id_from:       currentUserId,
      entity_id_to:       newContentId,
      entity_name:        'posts',
      signed_transaction: signedTransaction,
    };

    return await UsersActivityRepository.createNewActivity(data, transaction);
  }

  /**
   *
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

    const data = await ActivityUserUserRepository.getUserActivityData(user_id);

    let IFollow = [];
    let myFollowers = [];
    data.forEach(activity => {
      if (ActivityDictionary.isFollowActivity(activity)) {
        if (activity.user_id_from === user_id) {
          IFollow.push(activity.user_id_to);
        } else if (activity.user_id_to === user_id) {
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
    const activityTypeId = ActivityDictionary.getFollowId();

    await this._userFollowOrUnfollowUser(userFrom,userIdTo, activityTypeId, body);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} userIdTo
   * @returns {Promise<Object>}
   */
  static async userUnfollowsUser(userFrom, userIdTo) {
    const activity_type_id = ActivityDictionary.getUnfollowId();

    return await this._userFollowOrUnfollowUser(userFrom, userIdTo, activity_type_id);
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

  static async createAndSignOrganizationCreatesPostTransaction(
    userFrom,
    organizationBlockchainId,
    postBlockchainId,
    postTypeId
  ) {
    // noinspection JSUnresolvedFunction
    return await TransactionFactory._getSignedOrganizationCreatesPost(
      userFrom.account_name,
      userFrom.private_key,
      organizationBlockchainId,
      postBlockchainId,
      postTypeId
    );
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} userIdTo
   * @param {number} activityTypeId
   * @param {Object|string|null} body
   * @returns {Promise<boolean>}
   * @private
   */
  static async _userFollowOrUnfollowUser(userFrom, userIdTo, activityTypeId, body = null) {
    await this._checkPreconditions(userFrom, userIdTo, activityTypeId);

    const userToAccountName = await UsersRepository.findAccountNameById(userIdTo);

    const activity = await db
      .transaction(async transaction => {

        let signed = null;
        if (body) {
          winston.info(`signed is got from request body`);
          signed = body.signed_transaction;
          winston.info(`success, signed is: ${signed}`);
        } else {
            // noinspection JSUnresolvedFunction
            winston.info('signed is got from backend');

            signed = await this._getSignedFollowTransaction(
              userFrom, userToAccountName, activityTypeId
            );

            signed = JSON.stringify(signed);
        }

        return await ActivityUserUserRepository.createNewActivity(
          userFrom.id,
          userIdTo,
          activityTypeId,
          signed,
          transaction
        );
      });

    await this._sendPayloadToRabbit(activity, 'activity_user_user');

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

    const currentFollowStatus = await ActivityUserUserRepository.getCurrentFollowCondition(userFrom.id, userIdTo);

    if (currentFollowStatus === activityTypeId) {
      throw new BadRequestError({
        'general': 'It is not possible to follow/unfollow twice'
      }, status('400'));
    }

    if (!ActivityDictionary.isOppositeActivityRequired(activityTypeId)) {
      return;
    }

    if (!currentFollowStatus || currentFollowStatus !== ActivityDictionary.getOppositeFollowActivityTypeId(activityTypeId)) {
      throw new BadRequestError({
        'general': 'It is not possible to unfollow before follow'
      }, status('400'));
    }
  }
}

module.exports = UserActivityService;