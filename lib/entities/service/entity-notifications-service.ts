/* tslint:disable:max-line-length */
const notificationsRepo = require('../repository').Notifications;
const apiPostProcessor = require('../../common/service').PostProcessor;
const { BadRequestError } = require('../../api/errors');

const notificationsStatusDictionary = require('../../entities/dictionary').NotificationsStatus;
const usersTeamRepository = require('../../users/repository').UsersTeam;
const orgModelProvider = require('../../organizations/service').ModelProvider;

const queryFilterService = require('../../api/filters/query-filter-service');
const eventIdDictionary = require('../../entities/dictionary').EventId;
const entityNotificationsRepository = require('../../entities/repository').Notifications;

const NOTIFICATION_STATUS__PENDING      = 0;

const db = require('../../../models').sequelize;

class EntityNotificationsService {
  private currentUser;

  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @param {number} notificationId
   * @return {Promise<Object>}
   */
  async confirmPromptNotification(notificationId) {
    // #task validate a request

    const userId = this.currentUser.id;
    const confirmed = notificationsStatusDictionary.getStatusConfirmed();
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

    return await this.getAndProcessOneNotification(notificationId);
  }

  /**
   *
   * @param {number} notificationId
   * @return {Promise<Object>}
   */
  async markNotificationAsSeen(notificationId) {
    // #task validate request

    const userId = this.currentUser.id;

    const notification = await notificationsRepo.findOneByRecipientIdAndId(notificationId, userId);

    if (!notification) {
      throw new BadRequestError({ general: `There is no notification with ID ${notificationId} which belongs to you` });
    }

    if (eventIdDictionary.doesEventRequirePrompt(notification)) {
      await notificationsRepo.setStatusSeen(notificationId);
    } else {
      await notificationsRepo.setStatusSeenAndFinished(notificationId);
    }

    return await this.getAndProcessOneNotification(notificationId);
  }

  /**
   *
   * @param {number} notificationId
   * @return {Promise<Object>}
   */
  async declinePromptNotification(notificationId) {
    // #task validate request

    const userId = this.currentUser.id;
    const confirmed = notificationsStatusDictionary.getStatusDeclined();
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

    return await this.getAndProcessOneNotification(notificationId);
  }

  /**
   *
   * @param {number} notificationId
   * @return {Promise<Object>}
   */
  async pendingPromptNotification(notificationId) {
    // #task validate request

    const confirmed = NOTIFICATION_STATUS__PENDING;
    const seen = false;
    const finished = false;

    // #task - add userId

    const res = await notificationsRepo.setNotificationStatus(notificationId, confirmed, finished, seen);

    return res;
  }

  /**
   *
   * @param {number} id
   * @return {Promise<{data: Object[], metadata}>}
   */
  async getAndProcessOneNotification(id) {
    const currentUserId = this.currentUser.id;

    const data = await notificationsRepo.findOneByRecipientIdAndId(id, currentUserId);
    apiPostProcessor.processOneNotificationForResponse(data);

    const unreadMessages = await entityNotificationsRepository.countUnreadMessages(currentUserId);

    data.myselfData = {
      unread_messages_count: unreadMessages,
    };

    return data;
  }

  /**
   * @param {Object} query
   * @return {Promise<{data, metadata}>}
   */
  async getAllNotifications(query) {
    const userId = this.currentUser.id;

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
