const request = require('supertest');
const server = require('../../../app');


const checkAccountRoute = '/api/v1/auth/registration/validate-account-name';
const registrationRoute = '/api/v1/auth/registration';

class RequestHelper {
  static getCheckAccountNameRoute() {
    return checkAccountRoute;
  }
  static getRegistrationRoute() {
    return registrationRoute;
  }

  static async sendPatch(url, token, payload) {
    const res = await request(server)
      .patch(url)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
    ;

    expect(res.status).toBe(200);

    return res.body;
  }
}

module.exports = RequestHelper;