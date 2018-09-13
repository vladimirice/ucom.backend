const UsersRepository = require('../users/users-repository');
const BlockchainStatusDictionary = require('../eos/eos-blockchain-status-dictionary');
const models = require('../../models');
const UserPostProcessor = require('../users/user-post-processor');

class UsersService {
  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @param {Object} users
   * @param {number} currentUserId
   */
  static processUsersAfterQuery(users, currentUserId) {
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
  async getUserById(userId) {

    /*
    SELECT
    CASE
    WHEN user_id_from = 1 THEN 'I_follow'
    WHEN user_id_to = 1 THEN 'my_follower'
    END as follow_status,
      "Users".id,
      account_name,
      first_name,
      last_name,
      nickname,
      avatar_filename,
      current_rate
    FROM "Users"
    INNER JOIN
    (SELECT DISTINCT ON (user_id_from, user_id_to) id, activity_type_id, user_id_from, user_id_to
    FROM activity_user_user
    WHERE user_id_from = 1 OR user_id_to = 1
    ORDER BY user_id_from, user_id_to, id DESC) AS I_follow
    ON I_follow.user_id_from = "Users".id OR I_follow.user_id_to = "Users".id
    WHERE "Users".id != 1 AND activity_type_id = 1
    ;
    */

    const currentUserId = this.currentUser.getCurrentUserId();

    const user = await UsersRepository.getUserById(userId);

    if (!user) {
      return null;
    }

    const userJson = user.toJSON();

    UserPostProcessor.processUser(userJson, currentUserId);

    return userJson;
  }

  static async findOneByAccountName(account_name) {
    const user = await models['Users'].findOne({where: {account_name}});

    UserPostProcessor.processUser(user);

    return user;
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