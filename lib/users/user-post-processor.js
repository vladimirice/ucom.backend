const EosImportance = require('../eos/eos-importance');

class UserPostProcessor {

  /**
   *
   * @param {Object} user to process
   * @param {number} currentUserId - logged user ID
   */
  static processUser(user, currentUserId) {
    if (!user) {
      return;
    }

    this._addMyselfData(user, currentUserId);
    this._normalizeMultiplier(user);
    this._makeFollowersFlat(user);
    this._makeIFollowFlat(user);
    this._deleteSensitiveData(user);
  }

  /**
   *
   * @param {Object} user
   * @private
   */
  static _deleteSensitiveData(user) {
    const sensitiveFields = [
      'private_key',
      'blockchain_registration_status',
      'owner_public_key',
      'public_key'
    ];

    sensitiveFields.forEach(field => {
      delete user[field];
    });
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
   * @private
   */
  static _makeIFollowFlat(user) {
    if (!user['I_follow']) {
      return;
    }

    user['I_follow'] = user['I_follow'].map(record => {
      return record['is_followed'];
    });
  }

  /**
   *
   * @param {Object} user
   * @param {number} currentUserId
   * @private
   */
  static _addMyselfData(user, currentUserId) {
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
    const multiplier = EosImportance.getImportanceMultiplier();

    user.current_rate = (user.current_rate * multiplier);

    user.current_rate = user.current_rate.toFixed();
  }
}

module.exports = UserPostProcessor;