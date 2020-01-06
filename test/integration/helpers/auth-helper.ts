import ResponseHelper = require('./response-helper');

const expect = require('expect');

class AuthHelper {
  static validateAuthResponse(response, accountName: string) {
    ResponseHelper.expectStatusOk(response);

    const { body } = response;

    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('token');
    expect(body.token.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('user');
    expect(body.user.account_name).toBe(accountName);
  }
}

export = AuthHelper;
