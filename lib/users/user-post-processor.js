const EosImportance = require('../eos/eos-importance');

class UserPostProcessor {

  /**
   *
   * @param {Object} user to process
   * @param {number} currentUserId - logged user ID
   */
  static processUser(user, currentUserId) {
    this._addMyselfData(user, currentUserId);
    this._normalizeMultiplier(user);
    this._makeFollowersFlat(user);
  }

  /**
   *
   * @param {Object} user
   * @private
   */
  static _makeFollowersFlat(user) {
    if (!user['followed_by']) {
      return;
    }

    user['followed_by'] = user['followed_by'].map(record => {
      return record['follower'];
    });
  }

  /**
   *
   * @param {Object} user
   * @param {number} currentUserId
   * @private
   */
  static _addMyselfData(user, currentUserId) {
    if (!user) {
      return;
    }

    if (!currentUserId) {
      return;
    }

    if (!user) {
      return;
    }

    let myselfData = {
      follow: false
    };

    if (user['followed_by']) {
      for(let i = 0; i < user['followed_by'].length; i++) {
        const activity = user['followed_by'][i];
        if(activity.user_id_from === currentUserId) {
          myselfData.follow = true;
          break;
        }
      }
    }

    user.myselfData = myselfData;
  }

  /**
   * @param {Object} user
   * @private
   */
  static _normalizeMultiplier(user) {
    if (!user) {
      return;
    }

    const multiplier = EosImportance.getImportanceMultiplier();

    user.current_rate = (user.current_rate * multiplier);

    user.current_rate = user.current_rate.toFixed();
  }
}

module.exports = UserPostProcessor;