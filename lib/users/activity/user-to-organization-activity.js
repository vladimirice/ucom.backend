const status = require('statuses');

const UsersActivityRepository = require('../../users/repository').Activity;
const OrgModelProvider = require('../../organizations/service').ModelProvider;

const ActivityGroupDictionary = require('../../activity/activity-group-dictionary');
const models = require('../../../models');
const db = models.sequelize;
const {BadRequestError} = require('../../api/errors');
const OrganizationsRepositories = require('../../organizations/repository');
const UserActivityService = require('../../users/user-activity-service');

const EventIdDictionary = require('../../entities/dictionary').EventId;

const { TransactionFactory, InteractionTypeDictionary } = require('uos-app-transaction');

const ENTITY_NAME = OrgModelProvider.getEntityName();

class UserToOrganizationActivity {
  /**
   * @param {Object} userFrom
   * @param {number} orgIdTo
   * @param {Object} body
   * @returns {Promise<void>} created activity model
   */
  static async userFollowsOrganization(userFrom, orgIdTo, body) {
    const activityTypeId = InteractionTypeDictionary.getFollowId();

    await this._userFollowsOrUnfollowsOrganization(userFrom, orgIdTo, activityTypeId, body);
  }

  /**
   * @param {Object} userFrom
   * @param {number} orgIdTo
   * @param {Object} body
   * @returns {Promise<void>} created activity model
   */
  static async userUnfollowsOrganization(userFrom, orgIdTo, body) {
    const activityTypeId = InteractionTypeDictionary.getUnfollowId();

    return await this._userFollowsOrUnfollowsOrganization(userFrom, orgIdTo, activityTypeId, body);
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} orgId
   * @param {number} activityTypeId
   * @param {Object|string|null} body
   * @returns {Promise<boolean>}
   * @private
   */
  static async _userFollowsOrUnfollowsOrganization(userFrom, orgId, activityTypeId, body) {
    await this._addSignedTransactionsForOrganizationFollowing(body, userFrom, orgId, activityTypeId);

    const activityGroupId = ActivityGroupDictionary.getGroupContentInteraction();
    await this._checkFollowPreconditions(userFrom, orgId, activityTypeId, activityGroupId);

    const activity = await db
      .transaction(async transaction => {

        const eventId = activityTypeId === InteractionTypeDictionary.getFollowId() ?
          EventIdDictionary.getUserFollowsOrg() : EventIdDictionary.getUserUnfollowsOrg();

        const newActivityData = {
          activity_type_id:   activityTypeId,
          user_id_from:       userFrom.id,
          entity_id_to:       orgId,
          signed_transaction: body.signed_transaction,
          entity_name:        ENTITY_NAME,
          activity_group_id:  activityGroupId,

          event_id:           eventId,
        };

        return await UsersActivityRepository.createNewActivity(newActivityData, transaction);
      });

    await UserActivityService._sendPayloadToRabbit(activity, 'users_activity');

    return true;
  }

  /**
   *
   * @param {Object} userFrom
   * @param {number} orgIdTo
   * @param {number} activityTypeId
   * @param {number} activityGroupId
   * @returns {Promise<void>}
   * @private
   */
  static async _checkFollowPreconditions(userFrom, orgIdTo, activityTypeId, activityGroupId) {
    // if (userFrom.id === userIdTo) {
    //   throw new BadRequestError({
    //     'general': 'It is not possible to follow your own organization'
    //   }, status('400'));
    // }

    const currentFollowStatus = await UsersActivityRepository.getCurrentActivity(
      activityGroupId,
      userFrom.id,
      orgIdTo,
      ENTITY_NAME,
    );

    if (currentFollowStatus === activityTypeId) {
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

  /**
   * Remove this after signing transactions on frontend
   *
   * @param   {Object} body
   * @param   {Object} currentUser
   * @param   {number} orgId
   * @param   {number} activityTypeId
   * @return  {Promise<void>}
   * @private
   */
  static async _addSignedTransactionsForOrganizationFollowing(body, currentUser, orgId, activityTypeId) {
    if (body.signed_transaction) {

      return;
    }

    const blockchainId = await OrganizationsRepositories.Main.findBlockchainIdById(orgId);
    if (!blockchainId) {
      throw new AppError(`There is no blockchainId for orgId: ${orgId}`);
    }

    if (activityTypeId === InteractionTypeDictionary.getFollowId()) {
      body.signed_transaction = await TransactionFactory.getSignedUserFollowsOrg(
        currentUser.account_name,
        currentUser.private_key,
        blockchainId
      );
    } else {
      body.signed_transaction = await TransactionFactory.getSignedUserUnfollowsOrg(
        currentUser.account_name,
        currentUser.private_key,
        blockchainId
      );
    }
  }
}

module.exports = UserToOrganizationActivity;