const models = require('../../models');

class UsersRepository {
  static async getUserById(userId) {
    return await models['Users'].findOne({
      where: {
        id: userId
      },
      include: [{
        model: models['users_education'],
        as: 'users_education'
      }, {
        model: models['users_jobs'],
        as: 'users_jobs',
      }, {
        model: models['users_sources'],
        as: 'users_sources',
      }],
      order: [
        ['users_education', 'id', 'ASC'],
        ['users_jobs', 'id', 'ASC'],
        ['users_sources', 'source_type_id', 'ASC'],
      ]
    });
  }

  static async findAll() {
    return await models['Users'].findAll();
  }

  static async getUserByAccountName(accountName) {
    return await models['Users'].findOne({
      where: {
        account_name: accountName
      },
      include: [{
        model: models['users_education'],
        as: 'users_education'
      }, {
        model: models['users_jobs'],
        as: 'users_jobs',
      }, {
        model: models['users_sources'],
        as: 'users_sources',
      }],
      order: [
        [ 'users_education', 'id', 'ASC'],
        [ 'users_jobs', 'id', 'ASC'],
        [ 'users_sources', 'source_type_id', 'ASC'],
      ]
    });
  }
}

module.exports = UsersRepository;