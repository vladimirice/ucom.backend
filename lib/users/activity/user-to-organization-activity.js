const status = require('statuses');

const UsersActivityRepository = require('../../users/repository').Activity;
const OrgModelProvider = require('../../organizations/service/organizations-model-provider');
const ActivityGroupDictionary = require('../../activity/activity-group-dictionary');
const ActivityDictionary = require('../../activity/activity-types-dictionary');
const UsersRepository = require('../../users/repository').Main;
const models = require('../../../models');
const db = models.sequelize;
const {BadRequestError} = require('../../api/errors');

const ENTITY_NAME = OrgModelProvider.getEntityName();

class UserToOrganizationActivity {
  /**
   * @param {Object} userFrom
   * @param {number} orgIdTo
   * @param {Object} requestBody
   * @returns {Promise<void>} created activity model
   */
  static async userFollowsOrganization(userFrom, orgIdTo, requestBody) {
    const activityTypeId = ActivityDictionary.getFollowId();

    await this._userFollowsOrUnfollowsOrganization(userFrom, orgIdTo, activityTypeId, requestBody);
  }

  /**
   * @param {Object} userFrom
   * @param {number} orgIdTo
   * @param {Object} requestBody
   * @returns {Promise<void>} created activity model
   */
  static async userUnfollowsOrganization(userFrom, orgIdTo, requestBody) {
    const activityTypeId = ActivityDictionary.getUnfollowId();

    return await this._userFollowsOrUnfollowsOrganization(userFrom, orgIdTo, activityTypeId, requestBody);
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
  static async _userFollowsOrUnfollowsOrganization(userFrom, orgId, activityTypeId, body = null) {
    // Check if follow exists before unfollow

    const activityGroupId = ActivityGroupDictionary.getGroupContentInteraction();
    await this._checkFollowPreconditions(userFrom, orgId, activityTypeId, activityGroupId);

    // TODO - for signing transaction
    // const userToAccountName = await UsersRepository.findAccountNameById(orgId);

    await db
      .transaction(async transaction => {

        // let signed;
        // if (body && !_.isEmpty(body)) {
        //   winston.info(`signed is got from request body`);
        //   signed = body.signed_transaction;
        //   winston.info(`success, signed is: ${signed}`);
        // } else {
        //     // noinspection JSUnresolvedFunction
        //     winston.info('signed is got from backend');
        //
        //     signed = await this._getSignedFollowTransaction(
        //       userFrom, userToAccountName, activityTypeId
        //     );
        //
        //     signed = JSON.stringify(signed);
        // }

        let signed = 'sample_signed_transaction';

        const newActivityData = {
          activity_type_id:   activityTypeId,
          user_id_from:       userFrom.id,
          entity_id_to:       orgId,
          signed_transaction: signed,
          entity_name:        ENTITY_NAME,
          activity_group_id:  activityGroupId
        };

        return await UsersActivityRepository.createNewActivity(newActivityData, transaction);
      });

    // TODO - process transaction
    // await this._sendPayloadToRabbit(activity, 'activity_user_user');

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

module.exports = UserToOrganizationActivity;