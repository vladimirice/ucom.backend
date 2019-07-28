const expect = require('expect');

class AuthHelper {
  static validateAuthResponse(res, accountName) {
    expect(res.status).toBe(200);
    const { body } = res;

    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('token');
    expect(body.token.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('user');
    expect(body.user.account_name).toBe(accountName);
  }
}

export = AuthHelper;
