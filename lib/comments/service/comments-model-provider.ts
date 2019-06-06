import { IModelFieldsSet } from '../../common/interfaces/models-dto';

import CommentsFieldsSet = require('../models/comments-fields-set');

const { EntityNames } = require('ucom.libs.common').Common.Dictionary;
const models = require('../../../models');

const ENTITY_NAME = EntityNames.COMMENTS;

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

  public static getCommentsRelatedFieldsSet(): IModelFieldsSet {
    return CommentsFieldsSet.getAllFieldsSet();
  }
}

export = CommentsModelProvider;
