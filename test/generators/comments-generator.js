const RequestHelper   = require('../integration/helpers').Req;
const ResponseHelper  = require('../integration/helpers').Res;

const request = require('supertest');
const server = require('../../app');

class CommentsGenerator {
  /**
   * @param {number} postId
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async createCommentForPost(postId, user) {
    const req = request(server)
      .post(RequestHelper.getCommentsUrl(postId))
      .field('description', 'comment description')
    ;

    RequestHelper.addAuthToken(req, user);

    const res = await req;

    ResponseHelper.expectStatusCreated(res);

    return res.body;
  }
}

module.exports = CommentsGenerator;