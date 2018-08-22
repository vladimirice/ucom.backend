const usersSeeds = require('../../../seeders/users/users');
const eosAccounts = require('../../../seeders/users/eos_accounts');
const AuthService = require('../../../lib/auth/authService');

class UsersHelper {
  static validateUserJson(body, expectedUser) {
    expect(body.hasOwnProperty('account_name')).toBeTruthy();
    expect(body.account_name).toBe(expectedUser.account_name);

    expect(body.hasOwnProperty('users_education')).toBeTruthy();
    expect(body.hasOwnProperty('users_jobs')).toBeTruthy();

    expect(typeof body['users_education']).toBe('object');
    expect(typeof body['users_jobs']).toBe('object');
  }

  static getUserVlad() {
    const vladSeed = UsersHelper.getUserVladSeed();
    const token = AuthService.getNewJwtToken(vladSeed);

    return {
      ...vladSeed,
      token
    }
  }

  static getUserVladSeed() {
    return usersSeeds[0];
  }

  static getVladEosAccount() {
    return eosAccounts[0];
  }

  static getUserJaneSeed() {
    return usersSeeds[1];
  }

  static getJaneEosAccount() {
    return eosAccounts[1];
  }
}

module.exports = UsersHelper;