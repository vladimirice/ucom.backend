const models = require('../../models');
const Op = models.sequelize.Op;

class UsersRepository {
  static async getUserById(userId) {
    const followerAttributes = this.getModel().shortUserInfoFields();

    return await models['Users'].findOne({
      where: {
        id: userId
      },
      include: [
        {
          model: models['users_education'],
          as: 'users_education'
        },
        {
          model: models['users_jobs'],
          as: 'users_jobs',
        },
        {
          model: models['users_sources'],
          as: 'users_sources',
        },
        {
          model: models['activity_user_user'],
          as: 'I_follow',
        },
        {
          model: models['activity_user_user'],
          as: 'followed_by',
          include: [
            {
              model: models['Users'],
              attributes: followerAttributes,
              as: 'follower'
            }
          ]
        },
      ],
      order: [
        ['users_education', 'id', 'ASC'],
        ['users_jobs', 'id', 'ASC'],
        ['users_sources', 'source_type_id', 'ASC'],
      ]
    });
  }

  /**
   *
   * @param {string} query
   * @returns {Promise<Array<Object>>}
   */
  static async findByNameFields(query) {
    return await this.getModel().findAll({
      attributes: [
        'id', 'account_name', 'first_name', 'last_name', 'nickname', 'avatar_filename',
      ],
      where: {
        $or: {
          'first_name': {
            $like: `%${query}%`
          },
          'last_name': {
            $like: `%${query}%`
          },
          'account_name': {
            $like: `%${query}%`
          },
          'nickname': {
            $like: `%${query}%`
          },
        }
      },
      raw: true
    });
  }

  static async findOneById(user_id) {
    return await this.getModel().findOne({
      where: {
        id: user_id
      }
    });
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async doesUserExistWithId(id) {
    const count = await this.getModel().count({
      where: {
        id
      }
    });

    return !!count;
  }

  static async findAll(isRaw = false) {
    return await models['Users'].findAll({raw: isRaw});
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