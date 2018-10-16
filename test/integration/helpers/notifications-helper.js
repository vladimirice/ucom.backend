const request = require('supertest');
const server = require('../../../app');
const RequestHelper = require('./request-helper');
const ResponseHelper = require('./response-helper');

const EntityModelProvider = require('../../../lib/entities/service').ModelProvider;

class NotificationsHelper {

  /**
   *
   * @param {Object} myself
   * @param {number} id
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   *
   * @link EntityNotificationsService#confirmPromptNotification
   */
  static async requestToConfirmPrompt(myself, id, expectedStatus = 200) {
    const url = RequestHelper.getConfirmNotificationUrl(id);

    const res = await request(server)
      .post(url)
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   *
   * @param {Object} myself
   * @param {number} id
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   *
   * @link EntityNotificationsService#declinePromptNotification
   */
  static async requestToDeclinePrompt(myself, id, expectedStatus = 200) {
    const url = RequestHelper.getDeclineNotificationUrl(id);

    const res = await request(server)
      .post(url)
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   *
   * @param {Object} myself
   * @param {number} id
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   *
   * @link EntityNotificationsService#pendingPromptNotification
   */
  static async requestToPendingPrompt(myself, id, expectedStatus = 200) {
    const url = RequestHelper.getPendingNotificationUrl(id);

    const res = await request(server)
      .post(url)
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  /**
   *
   * @param {Object} myself
   * @param {boolean} dataOnly
   * @param {number} expectedStatus
   * @return {Promise<*>}
   *
   * @link EntityNotificationsService#getAllNotifications
   */
  static async requestToGetNotificationsList(myself, dataOnly = true, expectedStatus = 200) {
    const url = RequestHelper.getMyselfNotificationsList();

    const res = await request(server)
      .get(url)
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    if (dataOnly) {
      return res.body.data;
    }

    return res;
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   */
  static checkNotificationPrompt(model, options) {
    const mustExist = EntityModelProvider.getNotificationsModel().getRequiredFields();
    ResponseHelper.expectFieldsAreExist(model, mustExist);
  }

  /**
   *
   * @param {Object} model
   * @param {Object} options
   */
  static checkNotificationItselfCommonFields(model, options) {
    this.checkNotificationPrompt(model, options);
  }
}

module.exports = NotificationsHelper;