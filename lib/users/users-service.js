const UsersRepository = require('./users-repository');
const BlockchainStatusDictionary = require('../eos/eos-blockchain-status-dictionary');
const models = require('../../models');
const UserPostProcessor = require('./user-post-processor');
const OrganizationPostProcessor = require('../organizations/service/organization-post-processor');
const UsersActivityService = require('./user-activity-service');
const UsersActivityRepository = require('./repository').Activity;

const OrganizationRepository = require('../organizations/repository').Main;


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
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  async getUserByIdAndProcess(userId) {
    // noinspection JSCheckFunctionSignatures
    const [user, activityData, userOrganizations] = await Promise.all([
      UsersRepository.getUserById(userId),
      UsersActivityRepository.findOneUserActivityWithInvolvedUsersData(userId),
      OrganizationRepository.findAllAvailableForUser(userId)
    ]);

    const userJson = user.toJSON();
    userJson.organizations = userOrganizations;

    UserPostProcessor.processUser(userJson, this.currentUser.id, activityData);
    OrganizationPostProcessor.processManyOrganizations(userJson.organizations);

    return userJson;
  }

  static async findOneByAccountName(account_name) {
    const user = await models['Users'].findOne({where: {account_name}});

    UserPostProcessor.processUser(user);

    return user;
  }

  /**
   *
   * @return {Promise<Object[]>}
   */
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