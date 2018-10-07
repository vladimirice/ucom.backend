const models = require('../../models');
const UserModelProvider = require('./users-model-provider');
const Op = models.sequelize.Op;

const model = UserModelProvider.getUsersModel();

const TABLE_NAME = 'Users';

class UsersRepository {

  /**
   *
   * @returns {{model: *, as: string}}
   * @private
   */
  static _includeFollowedBy() {
    return {
      model: models['activity_user_user'],
      as: 'followed_by',
    };
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<string>}
   */
  static async findAccountNameById(id) {
    const result = await this.getModel().findOne({
      attributes: ['account_name'],
      where: {id},
      raw: true,
    });

    return result ? result['account_name'] : null;
  }

  /**
   *
   * @param {number} userId
   * @returns {Promise<any>}
   */
  static async getUserById(userId) {
    // const followerAttributes = this.getModel().getFieldsForPreview();

    // Get user himself
    // Get user following data with related users

    let include = [
      {
        model: models.users_education,
        as: 'users_education'
      },
      {
        model: models.users_jobs,
        as: 'users_jobs',
      },
      {
        model: models.users_sources,
        as: 'users_sources',
      },
    ];

    return await models.Users.findOne({
      where: {
        id: userId
      },
      include,
      order: [
        ['users_education', 'id', 'ASC'],
        ['users_jobs', 'id', 'ASC'],
        ['users_sources', 'source_type_id', 'ASC'],
      ]
    });
  }


  /**
   *
   * @param {number} id
   * @return {Promise<Object>}
   */
  static async findOnlyItselfById(id) {
    return await UserModelProvider.getUsersModel().findOne({
      where: { id },
      raw: true
    });
  }


  /**
   *
   * @param {Object} where
   * @return {Promise<Object>}
   */
  static async findOneBy(where) {
    // TODO custom include based on parameter as in OrganizationRepository
    const result = await this.getModel().findOne({
      where,
    });

    return result ? result.toJSON() : null;
  }

  /**
   *
   * @param {string} query
   * @returns {Promise<Array<Object>>}
   */
  static async findByNameFields(query) {
    // noinspection JSUnusedGlobalSymbols
    return await this.getModel().findAll({
      attributes: this.getModel().getFieldsForPreview(),
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

  static async findAllForList() {
    const attributes = this.getModel().getFieldsForPreview();
    return await model.findAll({
      attributes,
      order: [
        ['current_rate', 'DESC'],
      ],
      raw: true,
    });
  }

  static async findAll(isRaw = false) {
    let include = [];

    include.push(this._includeFollowedBy());

    const attributes = this.getModel().getFieldsForPreview();
    const modelResult = await models['Users'].findAll({
      attributes,
      include,
      order: [
        ['current_rate', 'DESC'],
      ],
    });

    if (isRaw) {
      return modelResult.map(data => {
        return data.toJSON();
      });
    }

    return modelResult;
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

  /**
   *
   * @return {string}
   */
  static getUsersModelName() {
    return TABLE_NAME;
  }

  static getModel() {
    return models['Users'];
  }
}

module.exports = UsersRepository;