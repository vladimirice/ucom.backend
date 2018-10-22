const NotificationsRepo = require('../repository').Notifications;
const ApiPostProcessor = require('../../common/service').PostProcessor;
const { AppError } = require('../../api/errors');

const NotificationsStatusDictionary = require('../../entities/dictionary').NotificationsStatus;
const UsersTeamRepository = require('../../users/repository').UsersTeam;
const OrgModelProvider = require('../../organizations/service').ModelProvider;

const QueryFilterService = require('../../api/filters/query-filter-service');
const UsersModelProvider  = require('../../users/service').ModelProvider;

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
    ApiPostProcessor.processOneNotification(data);

    return data;
  }
  //
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

    ApiPostProcessor.processManyNotifications(data);

    return {
      data,
      metadata
    }
  }
}

module.exports = EntityNotificationsService;