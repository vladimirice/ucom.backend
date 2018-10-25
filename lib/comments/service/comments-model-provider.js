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

  /**
   *
   * @return {string}
   */
  static getCommentsSingularName() {
    return 'comment'
  }

  /**
   *
   * @return {string}
   */
  static getTableName() {
    return TABLE_NAME;
  }

  /**
   *
   * @return {string[]}
   */
  static getCommentsFieldsForPreview() {
    return this.getModel().getFieldsForPreview();
  }
}

module.exports = CommentsModelProvider;