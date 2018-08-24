const usersSeeds = require('../../../seeders/users/users');
const eosAccounts = require('../../../seeders/users/eos_accounts');
const AuthService = require('../../../lib/auth/authService');
const UsersRepository = require('../../../lib/users/users-repository');

class UsersHelper {
  static validateUserJson(body, expectedUser, userFromDb) {

    expect(body.hasOwnProperty('account_name')).toBeTruthy();
    expect(body.account_name).toBe(expectedUser.account_name);

    const fieldsToCheck = [
        'users_education',
        'users_jobs',
        'users_sources'
    ];

    fieldsToCheck.forEach(field => {
      expect(body.hasOwnProperty(field)).toBeTruthy();
      expect(typeof body[field]).toBe('object');
      expect(JSON.stringify(body[field])).toBe(JSON.stringify(userFromDb[field]))
    });
  }

  static async getUserVlad() {
    const vladSeed = UsersHelper.getUserVladSeed();
    const vladFromDb = await UsersRepository.getUserByAccountName(vladSeed.account_name);
    expect(vladFromDb).toBeDefined();

    const vladDbData = {
      id: vladFromDb.id
    };

    const token = AuthService.getNewJwtToken(vladSeed);

    return {
      ...vladSeed,
      ...vladDbData,
      token
    }
  }

  static async getUserJane() {
    const seed = UsersHelper.getUserJaneSeed();
    const fromDb = await UsersRepository.getUserByAccountName(seed.account_name);
    expect(fromDb).toBeDefined();

    const data = {
      id: fromDb.id
    };

    const token = AuthService.getNewJwtToken(seed);

    return {
      ...seed,
      ...data,
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