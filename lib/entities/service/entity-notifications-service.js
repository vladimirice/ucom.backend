
class EntityNotificationsService {
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   * @param {Object} query
   * @return {Promise<{data, metadata}>}
   */
  async getAllNotifications(query) {
    const data = {};
    const metadata = {};

    return {
      data,
      metadata
    }
  }
}

module.exports = EntityNotificationsService;