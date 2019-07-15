import { IModelFieldsSet } from '../common/interfaces/models-dto';

const { EntityNames } = require('ucom.libs.common').Common.Dictionary;

import UsersFieldsSet = require('./models/users-fields-set');
import UsersEducationFieldsSet = require('./models/users-education-fields-set');
import UsersJobsFields = require('./models/users-jobs-fields-set');
import UsersSourcesFields = require('./models/users-sources-fields-set');
import ErrorsHelper = require('../common/helper/errors/errors-helper');
import UosAccountsModelProvider = require('../uos-accounts-properties/service/uos-accounts-model-provider');

const models = require('../../models');

const USERS_TABLE_NAME                    = 'Users';
const USERS_TEAM_TABLE_NAME               = 'users_team';
const USERS_ACTIVITY_TABLE_NAME           = 'users_activity';
const USERS_ACTIVITY_TRUST_TABLE_NAME     = 'users_activity_trust';
const USERS_ACTIVITY_FOLLOW_TABLE_NAME    = 'users_activity_follow';
const USERS_ACTIVITY_REFERRAL_TABLE_NAME  = 'affiliates.users_activity_referral';
const USERS_SOURCES_TABLE_NAME            = 'users_sources';

const USERS_ENTITY_NAME = EntityNames.USERS; // in db there is a fixed char length of 10

class UsersModelProvider {
  public static getCurrentParamsTableName(): string {
    return 'users_current_params';
  }

  public static getForeignKeyField(): string {
    return 'user_id';
  }

  /**
   * alias
   * @return {string}
   */
  static getEntityName() {
    return this.getUsersEntityName();
  }

  /**
   *
   * @return {string}
   */
  static getUsersEntityName() {
    return USERS_ENTITY_NAME;
  }

  /**
   * alias
   * @return {string}
   */
  static getTableName() {
    return this.getUsersTableName();
  }

  public static getBlockchainIdFieldName(): string {
    return 'account_name';
  }

  public static getUsersTableName(): string {
    return USERS_TABLE_NAME;
  }

  public static getUsersActivityReferralTableName(): string {
    return USERS_ACTIVITY_REFERRAL_TABLE_NAME;
  }

  public static getUsersSourcesTableName(): string {
    return USERS_SOURCES_TABLE_NAME;
  }

  public static getUsersActivityTableName(): string {
    return USERS_ACTIVITY_TABLE_NAME;
  }

  public static getUsersActivityTrustTableName(): string {
    return USERS_ACTIVITY_TRUST_TABLE_NAME;
  }

  public static getUsersActivityFollowTableName(): string {
    return USERS_ACTIVITY_FOLLOW_TABLE_NAME;
  }

  /**
   *
   * @return {Object}
   */
  static getUsersActivityModel() {
    return models[this.getUsersActivityTableName()];
  }

  /**
   *
   * @return {string}
   */
  static getUsersTeamTableName() {
    return USERS_TEAM_TABLE_NAME;
  }

  /**
   *
   * @return {Object}
   */
  static getUsersModel() {
    return models[USERS_TABLE_NAME];
  }

  /**
   *
   * @return {Object}
   */
  static getUsersTeamModel() {
    return models[USERS_TEAM_TABLE_NAME];
  }

  /**
   *
   * @return {string[]}
   */
  static getUserFieldsForPreview() {
    return this.getUsersModel().getFieldsForPreview();
  }

  /**
   *
   * @param {string|null} alias
   * @return {Object}
   */
  public static getIncludeUsersPreview(alias = null) {
    const include: any = {
      model:      this.getUsersModel(),
      attributes: this.getUsersModel().getFieldsForPreview(),
      raw: true,
      include: [
        this.getIncludeUosAccountsProperties(),
        this.getIncludeUsersCurrentParams(),
      ],
    };

    if (alias) {
      include.as = alias;
    }

    return include;
  }

  public static getIncludeUosAccountsProperties() {
    return {
      model:      models[UosAccountsModelProvider.uosAccountsPropertiesTableNameWithoutSchema()],
      attributes: UosAccountsModelProvider.getFieldsToSelect(),
      required:   false,
      as:         'uos_accounts_properties',
    };
  }

  public static getIncludeUsersCurrentParams() {
    return {
      model:      models[this.getCurrentParamsTableName()],
      attributes: this.getCurrentParamsToSelect(),
      required:   false,
      as:         this.getCurrentParamsTableName(),
    };
  }

  /**
   *
   * @return {Object}
   */
  static getIncludeAuthorForPreview(required = true) {
    return {
      required,
      model:      this.getUsersModel(),
      attributes: this.getUsersModel().getFieldsForPreview(),
      include: [
        this.getIncludeUosAccountsProperties(),
        this.getIncludeUsersCurrentParams(),
      ],
    };
  }

  public static getCurrentParamsToSelect(): string[] {
    return [
      'posts_total_amount_delta',
      'scaled_importance_delta',
      'scaled_social_rate_delta',
    ];
  }

  /**
   *
   * @return {string}
   */
  static getUsersSingularName() {
    return 'User';
  }

  /**
   *
   * @return {Object}
   */
  static getUsersTeamIncludeWithUsersOnly(entityName, status = null) {
    const where: any = {
      entity_name: entityName,
    };

    if (status !== null) {
      where.status = status;
    }

    return  {
      where,
      model:   this.getUsersTeamModel(),
      as:       this.getUsersTeamTableName(),
      required: false,

      include: [
        this.getIncludeUsersPreview(),
      ],
    };
  }

  public static getUsersRelatedFieldsSet(): IModelFieldsSet {
    return UsersFieldsSet.getAllFieldsSet();
  }

  public static getUsersEducationRelatedFieldsSet(): IModelFieldsSet {
    return UsersEducationFieldsSet.getAllFieldsSet();
  }

  public static getUsersJobsRelatedFieldsSet(): IModelFieldsSet {
    return UsersJobsFields.getAllFieldsSet();
  }

  public static getUsersSourcesRelatedFieldsSet(): IModelFieldsSet {
    return UsersSourcesFields.getAllFieldsSet();
  }

  public static getFieldsSetByFieldName(fieldName: string): IModelFieldsSet {
    const set = {
      users_education: this.getUsersEducationRelatedFieldsSet,
      users_jobs: this.getUsersJobsRelatedFieldsSet,
      users_sources: this.getUsersSourcesRelatedFieldsSet,
    };

    if (!set[fieldName]) {
      ErrorsHelper.throwUnsupportedParamAppError(fieldName);
    }

    return set[fieldName];
  }

  public static getPropsFields(): string[] {
    return [
      'staked_balance',
      'validity',
      'importance',
      'scaled_importance',

      'stake_rate',
      'scaled_stake_rate',

      'social_rate',
      'scaled_social_rate',

      'transfer_rate',
      'scaled_transfer_rate',

      'previous_cumulative_emission',
      'current_emission',
      'current_cumulative_emission',

      ...this.getCurrentParamsToSelect(),
    ];
  }
}

export = UsersModelProvider;
