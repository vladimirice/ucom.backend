const models = require('../../models');

class ActivityTypesDictionary {
  static getFollowId() {
    return 1;
  }
  static getUpvoteId() {
    return 2;
  }
  static getJoinId() {
    return 3;
  }
}

module.exports = ActivityTypesDictionary;