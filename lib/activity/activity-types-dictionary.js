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

  static isJoinActivity(model) {
    return model.activity_type_id === this.getJoinId();
  }

  static isUpvoteActivity(model) {
    return model.activity_type_id === this.getUpvoteId();
  }

}

module.exports = ActivityTypesDictionary;