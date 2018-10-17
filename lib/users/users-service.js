const UsersRepository = require('./users-repository');
const BlockchainStatusDictionary = require('../eos/eos-blockchain-status-dictionary');
const models = require('../../models');
const UserPostProcessor = require('./user-post-processor');
const OrganizationPostProcessor = require('../organizations/service/organization-post-processor');
const UsersActivityService = require('./user-activity-service');
const UsersActivityRepository = require('./repository').Activity;

const ApiPostProcessor = require('../common/service').PostProcessor;

const OrganizationRepository = require('../organizations/repository').Main;
const EntityNotificationRepository = require('../entities/repository').Notifications;


class UsersService {
  constructor(currentUser) {
    this.currentUser = currentUser;
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

    if (userId === this.currentUser.id) {
      userJson.unread_messages_count = await EntityNotificationRepository.countUnreadMessages(userId);
    }

    return userJson;
  }

  /**
   *
   * @param {string} account_name
   * @return {Promise<Object>}
   */
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

    ApiPostProcessor.processUsersAfterQuery(users);

    return users;
  }

  /**
   *
   * @param {Object} user
   * @return {Promise<void>}
   */
  static async setBlockchainRegistrationIsSent(user) {
    await user.update({blockchain_registration_status: BlockchainStatusDictionary.getStatusIsSent()});
  }
}


module.exports = UsersService;