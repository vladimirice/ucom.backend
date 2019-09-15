/* tslint:disable:max-line-length */
import { EventsIdsDictionary } from 'ucom.libs.common';
import { StringToAnyCollection } from '../../common/interfaces/common-types';

import NotificationsStatusDictionary = require('../dictionary/notifications-status-dictionary');

const notificationsRepo = require('../repository').Notifications;
const apiPostProcessor = require('../../common/service').PostProcessor;
const { BadRequestError } = require('../../api/errors');

const usersTeamRepository = require('../../users/repository').UsersTeam;
const orgModelProvider = require('../../organizations/service').ModelProvider;

const queryFilterService = require('../../api/filters/query-filter-service');
const entityNotificationsRepository = require('../../entities/repository').Notifications;

const NOTIFICATION_STATUS__PENDING      = 0;

const db = require('../../../models').sequelize;

class EntityNotificationsService {
  public static async confirmPromptNotification(notificationId: number, userId: number) {
    // #task validate a request
    const confirmed = NotificationsStatusDictionary.getStatusConfirmed();
    const seen = true;
    const finished = true;

    const notification = await notificationsRepo.findOneByRecipientIdAndId(notificationId, userId);

    await db
      .transaction(async (transaction) => {
        await notificationsRepo.setNotificationStatus(notificationId, confirmed, finished, seen, transaction);
        // Update users team related record

        const entityName = orgModelProvider.getEntityName();
        const entityId = +notification.json_body.data.organization.id;

        await usersTeamRepository.setStatusConfirmed(entityName, entityId, userId, transaction);
      });

    return this.getAndProcessOneNotification(notificationId, userId);
  }

  public static async markNotificationAsSeen(notificationId: number, userId: number) {
    // #task validate request

    const notification = await notificationsRepo.findOneByRecipientIdAndId(notificationId, userId);

    if (!notification) {
      throw new BadRequestError({ general: `There is no notification with ID ${notificationId} which belongs to you` });
    }

    if (EventsIdsDictionary.doesEventRequirePrompt(notification)) {
      await notificationsRepo.setStatusSeen(notificationId);
    } else {
      await notificationsRepo.setStatusSeenAndFinished(notificationId);
    }

    return this.getAndProcessOneNotification(notificationId, userId);
  }

  public static async declinePromptNotification(notificationId: number, userId: number) {
    // #task validate request
    const confirmed = NotificationsStatusDictionary.getStatusDeclined();
    const seen = true;
    const finished = true;

    const notification = await notificationsRepo.findOneByRecipientIdAndId(notificationId, userId);

    await db
      .transaction(async (transaction) => {
        await notificationsRepo.setNotificationStatus(notificationId, confirmed, finished, seen, transaction);
        // Update users team related record

        const entityName = orgModelProvider.getEntityName();
        const entityId = +notification.json_body.data.organization.id;

        await usersTeamRepository.setStatusDeclined(entityName, entityId, userId, transaction);
      });

    return this.getAndProcessOneNotification(notificationId, userId);
  }

  /**
   *
   * @param {number} notificationId
   * @return {Promise<Object>}
   */
  // eslint-disable-next-line class-methods-use-this
  async pendingPromptNotification(notificationId) {
    // #task validate request

    const confirmed = NOTIFICATION_STATUS__PENDING;
    const seen = false;
    const finished = false;

    // #task - add userId
    return notificationsRepo.setNotificationStatus(notificationId, confirmed, finished, seen);
  }

  public static async getAndProcessOneNotification(id: number, currentUserId: number) {
    const data = await notificationsRepo.findOneByRecipientIdAndId(id, currentUserId);
    apiPostProcessor.processOneNotificationForResponse(data);

    const unreadMessages = await entityNotificationsRepository.countUnreadMessages(currentUserId);

    data.myselfData = {
      unread_messages_count: unreadMessages,
    };

    return data;
  }

  public static async getAllNotifications(query: StringToAnyCollection, userId: number) {
    const params = queryFilterService.getQueryParameters(query);

    const data        = await notificationsRepo.findAllNotificationsListByUserId(userId, params);
    const totalAmount = await notificationsRepo.countAllByUserRecipientId(userId);

    const metadata = queryFilterService.getMetadata(totalAmount, query, params);
    apiPostProcessor.processManyNotificationsForResponse(data);

    return {
      data,
      metadata,
    };
  }
}

export = EntityNotificationsService;
