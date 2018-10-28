const models = require('../../models');
const db = models.sequelize;

const OrgModelProvider      = require('../organizations/service').ModelProvider;
const CommentsModelProvider = require('./service').ModelProvider;
const UsersModelProvider    = require('../users/service').ModelProvider;
const userPreviewAttributes = UsersModelProvider.getUserFieldsForPreview();

const model = CommentsModelProvider.getModel();

class CommentsRepository {

  /**
   *
   * @return {Object[]}
   */
  static getCommentIncludedModels() {
    return [
      {
        model: UsersModelProvider.getUsersModel(),
        attributes: userPreviewAttributes,
        as: 'User'
      },

      {
        model:  this.getActivityUserCommentModel(),
        as:     this.getActivityUserCommentModelName(),
        required: false,
      },
      OrgModelProvider.getIncludeForPreview(),
    ]
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<string|null>}
   */
  static async findBlockchainIdById(id) {
    const result = await this.getModel().findOne({
      attributes: [ 'blockchain_id' ],
      where: { id },
      raw: true,
    });

    return result ? result.blockchain_id : null;
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<*>}
   */
  static async incrementCurrentVoteCounter(id) {
    return await this.getModel().update({
      current_vote: db.literal(`current_vote + 1`),
    }, {
      where: {
        id
      }
    });
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<*>}
   */
  static async decrementCurrentVoteCounter(id) {
    return await this.getModel().update({
      current_vote: db.literal(`current_vote - 1`),
    }, {
      where: {
        id
      }
    });
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<number>}
   */
  static async getCommentCurrentVote(id) {
    const result = await this.getModel().findOne({
      attributes: ['current_vote'],
      where: {
        id,
      },
      raw: true
    });

    return result ? +result['current_vote'] : null;
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<void>}
   */
  static async findOneById(id) {
    const attributes = model.getFieldsForPreview();

    const where = {
      id
    };
    const include = this.getCommentIncludedModels();

    const res = await this.getModel().findOne({
      attributes,
      where,
      include
    });

    return res.toJSON();
  }

  /**
   *
   * @param {number} commentable_id
   * @return {Promise<any[]>}
   */
  static async findAllByCommentableId(commentable_id) {
    // TODO - it is supposed that commentable ID is aways posts

    const attributes = model.getFieldsForPreview();
    const where = {
      commentable_id
    };

    // TODO - exclude user related activity to separate request, as for posts
    const include = this.getCommentIncludedModels();

    const result = await model.findAll({
      attributes,
      where,
      include
    });

    return result.map(data => {
      return data.toJSON();
    });
  }



  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {number} id - comment ID
   * @returns {Promise<string|null>}
   */
  static async getPathById(id) {
    const result = await this.getModel().findOne({
      attributes: [
        'path'
      ],
      where: {
        id
      },
      raw: true
    });

    return result ? result['path'] : null;
  }

  /**
   *
   * @param {Object} data
   * @param {Object} transaction
   * @returns {Promise<void>}
   */
  static async createNew(data, transaction) {
    return await this.getModel().create(data, transaction);
  }

  static getModel() {
    return models['comments'];
  }

  /**
   *
   * @returns {Object}
   */
  static getActivityUserCommentModel() {
    return models[this.getActivityUserCommentModelName()];
  }

  /**
   * @param {number} user_id
   * @returns {Promise<Model>}
   */
  static async findLastCommentByAuthor(user_id) {
    const result = await this.getModel().findOne({
      where: {
        user_id,
      },
      order: [
        ['id', 'DESC']
      ],
      raw: true,
    });

    if (result) {
      result.path = JSON.parse(result.path);
    }

    return result;
  }

  /**
   *
   * @returns {string}
   */
  static getActivityUserCommentModelName() {
    return 'activity_user_comment'
  }
}

module.exports = CommentsRepository;