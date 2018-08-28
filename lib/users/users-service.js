const EosImportance = require('../eos/eos-importance');
const UsersRepository = require('../users/users-repository');
const models = require('../../models');

class UsersService {
  static processUserAfterQuery (user) {
    if (!user) {
      return;
    }

    const multiplier = EosImportance.getImportanceMultiplier();

    user.current_rate = (user.current_rate * multiplier);

    user.current_rate = user.current_rate.toFixed();
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

    UsersService.processUserAfterQuery(user);

    return user;
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
}


module.exports = UsersService;