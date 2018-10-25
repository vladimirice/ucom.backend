const NotificationsRepo = require('../repository').Notifications;
const ApiPostProcessor = require('../../common/service').PostProcessor;
const { BadRequestError } = require('../../api/errors');

const NotificationsStatusDictionary = require('../../entities/dictionary').NotificationsStatus;
const UsersTeamRepository = require('../../users/repository').UsersTeam;
const UsersRepository = require('../../users/repository').Main;
const OrgModelProvider = require('../../organizations/service').ModelProvider;

const QueryFilterService = require('../../api/filters/query-filter-service');
const EventIdDictionary = require('../../entities/dictionary').EventId;

const NOTIFICATION_STATUS__PENDING      = 0;

const db = require('../../../models').sequelize;

class EntityNotificationsService {
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @param {number} notificationId
   * @return {Promise<Object>}
   */
  async confirmPromptNotification(notificationId) {
    // TODO validate request

    const userId = this.currentUser.id;
    const confirmed = NotificationsStatusDictionary.getStatusConfirmed();
    const seen = true;
    const finished = true;

    const notification = await NotificationsRepo.findOneByRecipientIdAndId(notificationId, userId);

    await db
      .transaction(async transaction => {
        await NotificationsRepo.setNotificationStatus(notificationId, confirmed, finished, seen, transaction);
        // Update users team related record

        const entityName = OrgModelProvider.getEntityName();
        const entityId = +notification.entity_id;

        await UsersTeamRepository.setStatusConfirmed(entityName, entityId, userId, transaction);
    });

    return await this.getAndProcessOneNotification(notificationId);
  }

  /**
   *
   * @param {number} notificationId
   * @return {Promise<Object>}
   */
  async markNotificationAsSeen(notificationId) {
    // TODO validate request

    const userId = this.currentUser.id;

    const notification = await NotificationsRepo.findOneByRecipientIdAndId(notificationId, userId);

    if (!notification) {
      throw new BadRequestError({'general': `There is no notification with ID ${notificationId} which belongs to you`});
    }

    if (EventIdDictionary.doesEventRequirePrompt(notification)) {
      await NotificationsRepo.setStatusSeen(notificationId);
    } else {
      await NotificationsRepo.setStatusSeenAndFinished(notificationId);
    }

    return await this.getAndProcessOneNotification(notificationId);
  }

  /**
   *
   * @param {number} notificationId
   * @return {Promise<Object>}
   */
  async declinePromptNotification(notificationId) {
    // TODO validate request

    const userId = this.currentUser.id;
    const confirmed = NotificationsStatusDictionary.getStatusDeclined();
    const seen = true;
    const finished = true;

    const notification = await NotificationsRepo.findOneByRecipientIdAndId(notificationId, userId);

    await db
      .transaction(async transaction => {
        await NotificationsRepo.setNotificationStatus(notificationId, confirmed, finished, seen, transaction);
        // Update users team related record

        const entityName = OrgModelProvider.getEntityName();
        const entityId = +notification.entity_id;

        await UsersTeamRepository.setStatusDeclined(entityName, entityId, userId, transaction);
      });

    return await this.getAndProcessOneNotification(notificationId);
  }

  /**
   *
   * @param {number} notificationId
   * @return {Promise<Object>}
   */
  async pendingPromptNotification(notificationId) {
    // TODO validate request

    const confirmed = NOTIFICATION_STATUS__PENDING;
    const seen = false;
    const finished = false;

    // TODO - add userId

    const res = await NotificationsRepo.setNotificationStatus(notificationId, confirmed, finished, seen);

    return res;
  }

  /**
   *
   * @param {number} id
   * @return {Promise<{data: Object[], metadata}>}
   */
  async getAndProcessOneNotification(id) {
    const currentUserId = this.currentUser.id;

    const data = await NotificationsRepo.findOneByRecipientIdAndId(id, currentUserId);
    ApiPostProcessor.processOneNotificationForResponse(data);

    return data;
  }

  /**
   * @param {Object} query
   * @return {Promise<{data, metadata}>}
   */
  async getAllNotifications(query) {
    const userId = this.currentUser.id;

    let params = QueryFilterService.getQueryParameters(query);

    const data        = await NotificationsRepo.findAllNotificationsListByUserId(userId, params);
    const totalAmount = await NotificationsRepo.countAllByUserRecipientId(userId);

    const metadata = QueryFilterService.getMetadata(totalAmount, query, params);


    ApiPostProcessor.processManyNotificationsForResponse(data);

    return {
      data,
      metadata
    }
  }

  /**
   *
   * @param {Object} data
   * @return {Promise<void>}
   * @private
   */
  async _addTargetEntityIfNecessary(data) {
    const recipientData = await UsersRepository.getUserWithPreviewFields(this.currentUser.id);

    data.forEach(item => {
      if (EventIdDictionary.isTargetEntityRecipient(item)) {
        if (item.target_entity) {
          throw new Error(`Notification with ID ${item.id} already has target_entity but must not have`);
        }

        item.target_entity = {
          User: recipientData
        }
      }
    });
  }
}

module.exports = EntityNotificationsService;