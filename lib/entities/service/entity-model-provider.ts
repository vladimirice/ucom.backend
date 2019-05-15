import { IModelFieldsSet } from '../../common/interfaces/models-dto';

import EntityFieldsSet = require('../models/entity-fields-set');

const models = require('../../../models');

const SOURCES_TABLE_NAME        = 'entity_sources';
const NOTIFICATIONS_TABLE_NAME  = 'entity_notifications';

class EntityModelProvider {
  /**
   *
   * @return {string}
   */
  static getSourcesTableName() {
    return SOURCES_TABLE_NAME;
  }

  /**
   *
   * @return {string}
   */
  static getNotificationsTableName() {
    return NOTIFICATIONS_TABLE_NAME;
  }

  /**
   *
   * @return {Object}
   */
  static getNotificationsModel() {
    return models[NOTIFICATIONS_TABLE_NAME];
  }

  /**
   *
   * @return {string[]}
   */
  static getNotificationsPreviewAttributes() {
    return this.getNotificationsModel().getRequiredFields();
  }

  /**
   *
   * @return {string[]}
   */
  static getNotificationsRequiredFieldsToProcess() {
    return this.getNotificationsModel().getRequiredFieldsToProcess();
  }

  /**
   *
   * @return {Object}
   */
  static getSourcesModel() {
    return models[SOURCES_TABLE_NAME];
  }

  public static getEntitySourcesFieldsSet(): IModelFieldsSet {
    return EntityFieldsSet.getEntitySourcesFieldsSet();
  }
}

export = EntityModelProvider;
