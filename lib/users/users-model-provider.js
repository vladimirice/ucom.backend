const models = require('../../models');

const USERS_TABLE_NAME      = 'Users';
const USERS_TEAM_TABLE_NAME = 'users_team';
const USERS_ENTITY_NAME     = 'users';

class UsersModelProvider {

  /**
   *
   * @return {string}
   */
  static getEntityName() {
    return USERS_ENTITY_NAME;
  }
  /**
   *
   * @return {string}
   */
  static getUsersTableName() {
    return USERS_TABLE_NAME;
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
   * @param {string|null} alias
   * @return {Object}
   */
  static getIncludeUsersPreview(alias = null) {
    let include = {
      model:      this.getUsersModel(),
      attributes: this.getUsersModel().getFieldsForPreview(),
      raw: true,
    };

    if (alias) {
      include.as = alias;
    }

    return include;
  }

  /**
   *
   * @return {Object}
   */
  static getUsersTeamIncludeWithUsersOnly(entity_name) {
    return {
      model:   this.getUsersTeamModel(),
      where:   {entity_name},
      as:       this.getUsersTeamTableName(),
      required: false,

      include: [
        this.getIncludeUsersPreview(),
      ]
    }
  }
}

module.exports = UsersModelProvider;