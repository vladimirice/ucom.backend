const models = require('../../models');

const USERS_TABLE_NAME      = 'Users';
const USERS_TEAM_TABLE_NAME = 'users_team';

class UsersModelProvider {
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
  static getUsersTeamIncludeWithUsersOnly() {
    return {
      model:   this.getUsersTeamModel(),
      where:   {entity_name : 'org'},
      as:       this.getUsersTeamTableName(),

      include: [
        this.getIncludeUsersPreview(),
      ]
    }
  }
}

module.exports = UsersModelProvider;