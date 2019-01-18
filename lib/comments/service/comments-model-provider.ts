const models = require('../../../models');

const ENTITY_NAME = 'comments  ';

const TABLE_NAME = 'comments';

class CommentsModelProvider {

  /**
   *
   * @return {string}
   */
  static getEntityName(): string {
    return ENTITY_NAME;
  }

  /**
   *
   * @return {string}
   */
  static getModelName(): string {
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
  static getCommentsSingularName(): string {
    return 'comment';
  }

  /**
   *
   * @return {string}
   */
  static getCommentsTableName(): string {
    return TABLE_NAME;
  }

  static getTableName(): string {
    return this.getCommentsTableName();
  }

  /**
   *
   * @return {string[]}
   */
  static getCommentsFieldsForPreview(): string[] {
    return this.getModel().getFieldsForPreview();
  }

  /**
   *
   * @param {string} entityName
   * @return {boolean}
   */
  static isComment(entityName): boolean {
    return entityName === this.getEntityName();
  }
}

export = CommentsModelProvider;
