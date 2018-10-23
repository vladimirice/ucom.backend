const GROUP__CONTENT_CREATION                 = 1; // content creation by user himself
const GROUP__CONTENT_INTERACTION              = 2;
const GROUP__USER_USER_INTERACTION            = 3;
const GROUP_CONTENT_CREATION_BY_ORGANIZATION  = 4;


const GROUP__USERS_TEAM_INVITATION            = 20;

class ActivityGroupDictionary {

  /**
   *
   * @return {number}
   */
  static getGroupContentCreation() {
    return GROUP__CONTENT_CREATION;
  }

  /**
   *
   * @return {number}
   */
  static getGroupUsersTeamInvitation() {
    return GROUP__USERS_TEAM_INVITATION;
  }

  /**
   *
   * @return {number}
   */
  static getGroupContentInteraction() {
    return GROUP__CONTENT_INTERACTION;
  }

  /**
   *
   * @return {number}
   */
  static getGroupUserUserInteraction() {
    return GROUP__USER_USER_INTERACTION;
  }

  /**
   *
   * @return {number}
   */
  static getGroupContentCreationByOrganization() {
    return GROUP_CONTENT_CREATION_BY_ORGANIZATION;
  }
}

module.exports = ActivityGroupDictionary;