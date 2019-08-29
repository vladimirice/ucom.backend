/* tslint:disable:max-line-length */
import { Transaction } from 'knex';
import { UserModel } from '../interfaces/model-interfaces';
import { IRequestBody } from '../../common/interfaces/common-types';
import { IActivityOptions } from '../../eos/interfaces/activity-interfaces';
import { AppError, BadRequestError } from '../../api/errors';

import UsersActivityRepository = require('../repository/users-activity-repository');
import knex = require('../../../config/knex');
import NotificationsEventIdDictionary = require('../../entities/dictionary/notifications-event-id-dictionary');
import UsersActivityFollowRepository = require('../repository/users-activity/users-activity-follow-repository');

import EosTransactionService = require('../../eos/eos-transaction-service');
import UserActivityService = require('../user-activity-service');
import OrganizationsModelProvider = require('../../organizations/service/organizations-model-provider');
import ActivityGroupDictionary = require('../../activity/activity-group-dictionary');
import EosInputProcessor = require('../../eos/input-processor/content/eos-input-processor');

const status = require('statuses');

const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');

const ENTITY_NAME = OrganizationsModelProvider.getEntityName();

class UserToOrganizationActivity {
  public static async userFollowsOrganization(
    userFrom: UserModel,
    organizationId: number,
    body: IRequestBody,
  ): Promise<void> {
    const activityTypeId = InteractionTypeDictionary.getFollowId();

    await this.userFollowsOrUnfollowsOrganization(userFrom, organizationId, activityTypeId, body);
  }

  public static async userUnfollowsOrganization(
    userFrom: UserModel,
    organizationId: number,
    body: IRequestBody,
  ): Promise<void> {
    const activityTypeId = InteractionTypeDictionary.getUnfollowId();

    await this.userFollowsOrUnfollowsOrganization(userFrom, organizationId, activityTypeId, body);
  }

  private static async userFollowsOrUnfollowsOrganization(
    userFrom: UserModel,
    organizationId: number,
    activityTypeId: number,
    body: IRequestBody,
  ): Promise<void> {
    EosInputProcessor.isSignedTransactionOrError(body);

    const activityGroupId = ActivityGroupDictionary.getGroupContentInteraction();
    await this.checkFollowPreconditions(userFrom, organizationId, activityTypeId, activityGroupId);

    const activity = await knex.transaction(async (trx) => {
      const eventId = activityTypeId === InteractionTypeDictionary.getFollowId() ?
        NotificationsEventIdDictionary.getUserFollowsOrg() : NotificationsEventIdDictionary.getUserUnfollowsOrg();

      await this.createFollowIndex(eventId, userFrom.id, organizationId, trx);

      const newActivityData = {
        activity_type_id:   activityTypeId,
        user_id_from:       userFrom.id,
        entity_id_to:       organizationId,
        signed_transaction: body.signed_transaction,
        entity_name:        ENTITY_NAME,
        activity_group_id:  activityGroupId,

        event_id:           eventId,
      };

      return UsersActivityRepository.createNewKnexActivity(newActivityData, trx);
    });

    const options: IActivityOptions = EosTransactionService.getEosVersionBasedOnSignedTransaction(
      body.signed_transaction,
    );

    await UserActivityService.sendPayloadToRabbitWithOptions(activity, options);
  }

  private static async createFollowIndex(
    eventId: number,
    userIdFrom: number,
    orgIdTo: number,
    trx: Transaction,
  ): Promise<void> {
    if (NotificationsEventIdDictionary.doesUserFollowOrg(eventId)) {
      await UsersActivityFollowRepository.insertOneFollowsOrganization(userIdFrom, orgIdTo, trx);

      return;
    }

    if (NotificationsEventIdDictionary.doesUserUnfollowOrg(eventId)) {
      const deleteRes = await UsersActivityFollowRepository.deleteOneFollowsOrg(userIdFrom, orgIdTo, trx);
      if (deleteRes === null) {
        throw new AppError(`No record to delete. It is possible that it is a concurrency issue. User ID from: ${userIdFrom}, org ID to ${orgIdTo}`);
      }

      return;
    }

    throw new AppError(`Unsupported eventId: ${eventId}`);
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
  private static async checkFollowPreconditions(userFrom, orgIdTo, activityTypeId, activityGroupId) {
    const currentFollowStatus = await UsersActivityRepository.getCurrentActivity(
      activityGroupId,
      userFrom.id,
      orgIdTo,
      ENTITY_NAME,
    );

    if (currentFollowStatus === activityTypeId) {
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

export = UserToOrganizationActivity;
