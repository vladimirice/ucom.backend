const EosImportance = require('../eos/eos-importance');
const UsersRepository = require('../users/users-repository');
const BlockchainStatusDictionary = require('../eos/eos-blockchain-status-dictionary');
const models = require('../../models');
const AuthService = require('../../lib/auth/authService');
const UserPostProcessor = require('../users/user-post-processor');

class UsersService {
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  static processUserAfterQuery (user, currentUserId) {
    if (!user) {
      return;
    }

    const multiplier = EosImportance.getImportanceMultiplier();

    user.current_rate = (user.current_rate * multiplier);

    user.current_rate = user.current_rate.toFixed();

    UserPostProcessor.processUser(user, currentUserId);
  }

  static processUsersAfterQuery(users) {
    users.forEach(user => {
      UsersService.processUserAfterQuery(user);
    });
  }

  /**
   * @param {integer} userId
   * @returns {Promise<*>}
   */
  async getUserById(userId) {
    const currentUserId = this.currentUser.getCurrentUserId();

    const user = await UsersRepository.getUserById(userId);

    if (!user) {
      return null;
    }

    const userJson = user.toJSON();

    UsersService.processUserAfterQuery(userJson, currentUserId);

    return userJson;
  }

  static async findOneByAccountName(account_name) {
    const user = await models['Users'].findOne({where: {account_name}});

    UsersService.processUserAfterQuery(user);

    return user;
  }

  static async findAll() {
    const users = await UsersRepository.findAll();

    UsersService.processUsersAfterQuery(users);

    return users;
  }

  static async setBlockchainRegistrationIsSent(user) {
    await user.update({blockchain_registration_status: BlockchainStatusDictionary.getStatusIsSent()});
  }
}


module.exports = UsersService;