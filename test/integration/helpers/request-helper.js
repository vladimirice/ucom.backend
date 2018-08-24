const request = require('supertest');
const server = require('../../../app');

class RequestHelper {
  static async sendPatch(url, token, payload) {
    const res = await request(server)
      .patch(url)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
    ;

    expect(res.status).toBe(200);

    return res.body;
  }

  static createWithBearer(user) {
    return request(server)
      .set('Authorization', `Bearer ${user.token}`)
    ;
  }
}

module.exports = RequestHelper;