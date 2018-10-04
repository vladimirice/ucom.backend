const models = require('../../../models');

const ENTITY_NAME = 'comments  ';

const TABLE_NAME = 'comments';

class CommentsModelProvider {

  /**
   *
   * @return {string}
   */
  static getEntityName() {
    return ENTITY_NAME;
  }

  /**
   *
   * @return {string}
   */
  static getModelName() {
    return TABLE_NAME;
  }

  /**
   *
   * @return {Object}
   */
  static getModel() {
    return models[TABLE_NAME];
  }
}

module.exports = CommentsModelProvider;