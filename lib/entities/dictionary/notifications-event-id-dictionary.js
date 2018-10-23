const ORG_USERS_TEAM_INVITATION   = 10;

const USER_FOLLOWS_YOU            = 30;
const USER_UPVOTES_YOUR_POST      = 31;
const USER_DOWNVOTES_YOUR_POST    = 32;

const USER_UPVOTES_YOUR_COMMENT   = 33;
const USER_DOWNVOTES_YOUR_COMMENT = 34;

const USER_FOLLOWS_ORG            = 50;
const USER_UPVOTES_ORG_POST       = 51;
const USER_DOWNVOTES_ORG_POST     = 52;

const USER_UPVOTES_ORG_COMMENT    = 53;
const USER_DOWNVOTES_ORG_COMMENT  = 54;

const USER_CREATES_DIRECT_POST_FOR_YOU    = 70;
const USER_COMMENTS_YOUR_POST             = 71;
const USER_LEAVES_COMMENT_ON_YOUR_COMMENT = 72;

const USER_CREATES_DIRECT_POST_FOR_ORG    = 90;
const USER_COMMENTS_ORG_POST              = 91;
const USER_LEAVES_COMMENT_ON_ORG_COMMENT  = 92;


class NotificationsEventIdDictionary {

  /**
   *
   * @return {number}
   */
  static getOrgUsersTeamInvitation() {
    return ORG_USERS_TEAM_INVITATION;
  }
}

module.exports = NotificationsEventIdDictionary;