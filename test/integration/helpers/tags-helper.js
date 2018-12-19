const request = require('supertest');
const server = require('../../../app');
const RequestHelper = require('./request-helper');
const ResponseHelper = require('./response-helper');

class TagsHelper {

  /**
   *
   * @param {int} tagId
   * @param {number} expectedResponseStatus
   * @returns {Promise<*>}
   */
  static async requestToGetOneTagPageAsGuest(tagId, expectedResponseStatus = 200) {
    const url = RequestHelper.getTagsRootUrl() + `/${tagId}`;

    const res = await request(server)
      .get(url)
    ;

    ResponseHelper.expectStatusToBe(res, expectedResponseStatus);

    return res.body;
  }
}

module.exports = TagsHelper;