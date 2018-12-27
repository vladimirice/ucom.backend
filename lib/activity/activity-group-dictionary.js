const GROUP__CONTENT_CREATION                 = 1; // content creation by user himself
const GROUP__CONTENT_INTERACTION              = 2;
const GROUP__USER_USER_INTERACTION            = 3;
const GROUP_CONTENT_CREATION_BY_ORGANIZATION  = 4; // no repost creation by organization but user content creation by organization

const GROUP__USERS_TEAM_INVITATION                = 20;
const GROUP__USER_INTERACTS_WITH_BLOCKCHAIN_NODE  = 30;

const GROUP_CONTENT_UPDATING                      = 40;
const GROUP_TAG_EVENT                             = 50;

class ActivityGroupDictionary {

  /**
   *
   * @return {number}
   */
  static getUserInteractsWithBlockchainNode() {
    return GROUP__USER_INTERACTS_WITH_BLOCKCHAIN_NODE;
  }

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
  static getGroupTagEvent() {
    return GROUP_TAG_EVENT;
  }

  /**
   *
   * @returns {number}
   */
  static getGroupContentUpdating() {
    return GROUP_CONTENT_UPDATING;
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