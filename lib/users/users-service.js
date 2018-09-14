const UsersRepository = require('./users-repository');
const BlockchainStatusDictionary = require('../eos/eos-blockchain-status-dictionary');
const models = require('../../models');
const UserPostProcessor = require('./user-post-processor');
const UsersActivityService = require('./user-activity-service');
const UsersActivityRepository = require('./activity-user-user-repository');
const _ = require('lodash');

class UsersService {
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @param {Object} users
   * @param {number | null} currentUserId
   */
  static processUsersAfterQuery(users, currentUserId = null) {
    users.forEach(user => {
      UserPostProcessor.processUser(user, currentUserId)
    });
  }

  /**
   *
   * @param {string} query
   * @returns {Promise<Array<Object>>}
   */
  static async findByNameFields(query) {
    return await UsersRepository.findByNameFields(query);
  }

  /**
   * @param {integer} userId
   * @returns {Promise<Object>}
   */
  async getUserByIdAndProcess(userId) {
    // noinspection JSCheckFunctionSignatures
    const [user, activityData] = await Promise.all([
      UsersRepository.getUserById(userId),
      UsersActivityRepository.findUserActivityWithInvolvedUsersData(userId)
    ]);

    const userJson = user.toJSON();

    UserPostProcessor.processUser(userJson, this.currentUser.id, activityData);
    return userJson;
  }

  static async findOneByAccountName(account_name) {
    const user = await models['Users'].findOne({where: {account_name}});

    UserPostProcessor.processUser(user);

    return user;
  }

  async findAllAndProcessForList() {
    const currentUserId = this.currentUser.getCurrentUserId();

    const users = await UsersRepository.findAllForList();

    if (currentUserId) {
      const activityData = await UsersActivityService.getUserActivityData(currentUserId);
      UserPostProcessor.addMyselfDataByActivityArrays(users, activityData);
    }

    UsersService.processUsersAfterQuery(users);

    return users;
  }

  async findAll() {
    const users = await UsersRepository.findAll(true);
    const currentUserId = this.currentUser.getCurrentUserId();

    UsersService.processUsersAfterQuery(users, currentUserId);

    return users;
  }

  static async setBlockchainRegistrationIsSent(user) {
    await user.update({blockchain_registration_status: BlockchainStatusDictionary.getStatusIsSent()});
  }
}


module.exports = UsersService;