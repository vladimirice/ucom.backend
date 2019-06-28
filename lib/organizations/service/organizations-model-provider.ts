import { IModelFieldsSet } from '../../common/interfaces/models-dto';

import OrganizationsFieldsSet = require('../models/organizations-fields-set');

const { EntityNames } = require('ucom.libs.common').Common.Dictionary;
const models = require('../../../models');

const ENTITY_NAME = EntityNames.ORGANIZATIONS;

const TABLE_NAME = 'organizations';

class OrganizationsModelProvider {
  static getOrgFieldsForPreview() {
    return this.getModel().getFieldsForPreview();
  }

  static getEntityName(): string {
    return ENTITY_NAME;
  }

  public static getCurrentParamsTableName(): string {
    return 'organizations_current_params';
  }

  /**
   *
   * @return {string}
   */
  static getOrganizationSingularName() {
    return 'organization';
  }

  /**
   *
   * @return {string}
   */
  static getModelName() {
    return TABLE_NAME;
  }

  static getTableName(): string {
    return TABLE_NAME;
  }

  // noinspection JSUnusedGlobalSymbols
  static getBlockchainIdFieldName() {
    return 'blockchain_id';
  }

  /**
   *
   * @return {Object}
   */
  static getModel() {
    return models[TABLE_NAME];
  }

  public static getCurrentParamsInclude() {
    return {

    };
  }

  /**
   *
   * @return {Object}
   */
  static getIncludeForPreview(required = false) {
    return {
      required,
      model: this.getModel(),
      attributes: this.getModel().getFieldsForPreview(),
    };
  }

  public static getOrganizationsRelatedFieldsSet(): IModelFieldsSet {
    return OrganizationsFieldsSet.getAllFieldsSet();
  }
}

export = OrganizationsModelProvider;
