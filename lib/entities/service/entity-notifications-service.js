const NotificationsRepo = require('../repository').Notifications;


const NOTIFICATION_STATUS__PENDING      = 0;
const NOTIFICATION_STATUS__CONFIRMED    = 1;
const NOTIFICATION_STATUS__DECLINED     = 2;
const NOTIFICATION_STATUS__NOT_REQUIRED = 3;

class EntityNotificationsService {
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  async confirmPromptNotification(notificationId) {
    // TODO validate request

    const confirmed = NOTIFICATION_STATUS__CONFIRMED;
    const finished = true;

    const res = await NotificationsRepo.setNotificationStatus(notificationId, confirmed, finished);

    return res;
  }

  /**
   * @param {Object} query
   * @return {Promise<{data, metadata}>}
   */
  async getAllNotifications(query) {
    const currentUserId = this.currentUser.id;

    const data = await NotificationsRepo.findAllByUserRecipientId(currentUserId);
    const metadata = {};

    return {
      data,
      metadata
    }
  }
}

module.exports = EntityNotificationsService;