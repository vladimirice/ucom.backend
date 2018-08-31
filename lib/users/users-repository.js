const models = require('../../models');
const Op = models.sequelize.Op;

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

  static async findOneById(user_id) {
    return await this.getModel().findOne({
      where: {
        id: user_id
      }
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

  static async findAllWithRates() {
    let rows = await models['Users'].findAll({
      where: {
        current_rate: {
          [Op.gt]: 0
        },
      },
      order: [
        ['current_rate', 'DESC'],
        ['id', 'DESC']
      ],
    });

    return rows.map(row => {
      return row.toJSON();
    });
  }

  static getModel() {
    return models['Users'];
  }
}

module.exports = UsersRepository;