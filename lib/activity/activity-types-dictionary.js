const ACTIVITY__DOWNVOTE = 4;

class ActivityTypesDictionary {
  /**
   *
   * @returns {number}
   */
  static getFollowId() {
    return 1;
  }

  /**
   *
   * @returns {number}
   */
  static getUpvoteId() {
    return 2;
  }

  /**
   *
   * @returns {number}
   */
  static getJoinId() {
    return 3;
  }

  /**
   *
   * @returns {number}
   */
  static getDownvoteId() {
    return ACTIVITY__DOWNVOTE;
  }

  static isJoinActivity(model) {
    return model.activity_type_id === this.getJoinId();
  }

  static isUpvoteActivity(model) {
    return model.activity_type_id === this.getUpvoteId();
  }

  /**
   *
   * @param {Object} model
   * @returns {boolean}
   */
  static isDownvoteActivity(model) {
    return model.activity_type_id === this.getDownvoteId();
  }

}

module.exports = ActivityTypesDictionary;