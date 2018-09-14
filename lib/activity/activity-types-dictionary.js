const ACTIVITY__DOWNVOTE = 4;
const ACTIVITY__UNFOLLOW = 5;

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

  /**
   *
   * @returns {number}
   */
  static getUnfollowId() {
    return ACTIVITY__UNFOLLOW;
  }

  static isJoinActivity(model) {
    return model.activity_type_id === this.getJoinId();
  }

  static isUpvoteActivity(model) {
    return model.activity_type_id === this.getUpvoteId();
  }

  static isFollowActivity(model) {
    return model.activity_type_id === this.getFollowId();
  }

  /**
   *
   * @param {number} activityTypeId
   * @returns {number}
   */
  static getOppositeFollowActivityTypeId(activityTypeId) {
    if (activityTypeId === this.getFollowId()) {
      return this.getUnfollowId();
    }

    return this.getFollowId();
  }

  /**
   *
   * @param {number} activityTypeId
   * @returns {boolean}
   */
  static isOppositeActivityRequired(activityTypeId) {
    const required = [
      this.getUnfollowId()
    ];

    return required.indexOf(activityTypeId) !== -1;
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