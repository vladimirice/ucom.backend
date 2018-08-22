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
      }],
      order: [
        [ 'users_education', 'id', 'ASC'],
        [ 'users_jobs', 'id', 'ASC'],
      ]
    });
  }
}

module.exports = UsersRepository;