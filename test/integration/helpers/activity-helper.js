const RequestHelper = require('./request-helper');
const ResponseHelper = require('./response-helper');
const request = require('supertest');
const server = require('../../../app');

class ActivityHelper {
  static async createFollow(follower, followed) {
    const res = await request(server)
      .post(RequestHelper.getFollowUrl(followed.id))
      .set('Authorization', `Bearer ${follower.token}`)
    ;

    ResponseHelper.expectStatusOk(res);
  }
}

module.exports = ActivityHelper;