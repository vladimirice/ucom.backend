const request = require('supertest');
const server = require('../../../app');
const RequestHelper = require('./request-helper');
const ResponseHelper = require('./response-helper');

class NotificationsHelper {

  /**
   *
   * @param {Object} myself
   * @param {boolean} dataOnly
   * @param {number} expectedStatus
   * @return {Promise<*>}
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
}

module.exports = NotificationsHelper;