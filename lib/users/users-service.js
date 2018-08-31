const EosImportance = require('../eos/eos-importance');
const UsersRepository = require('../users/users-repository');
const BlockchainStatusDictionary = require('../eos/eos-blockchain-status-dictionary');
const models = require('../../models');
const AuthService = require('../../lib/auth/authService');

class UsersService {
  static processUserAfterQuery (user) {
    if (!user) {
      return;
    }

    const multiplier = EosImportance.getImportanceMultiplier();

    user.current_rate = (user.current_rate * multiplier);

    user.current_rate = user.current_rate.toFixed();

    this.addMyselfData(user);
  }


  /**
   * @deprecated
   * @see UserPostProcessor
   * @param user
   */
  static addMyselfData(user) {
    const currentUserId = AuthService.getCurrentUserId();
    if (!currentUserId) {
      return;
    }

    let myselfData = {
      follow: false
    };

    if (user['followed_by']) {
      for(let i = 0; i < user['followed_by'].length; i++) {
        const activity = user['followed_by'][i];
        if(activity.user_id_from === currentUserId) {
          myselfData.follow = true;
          break;
        }
      }
    }

    user.myselfData = myselfData;
  }

  static processUsersAfterQuery(users) {
    users.forEach(user => {
      UsersService.processUserAfterQuery(user);
    });
  }

  static async getUserById(userId) {
    const user = await UsersRepository.getUserById(userId);

    if (!user) {
      return null;
    }

    const userJson = user.toJSON();


    UsersService.processUserAfterQuery(userJson);

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