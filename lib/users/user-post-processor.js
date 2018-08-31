const AuthService = require('../auth/authService');
const EosImportance = require('../eos/eos-importance');

class UserPostProcessor {

  static processUser(user) {
    this._addMyselfData(user);
    this._normalizeMultiplier(user);
  }

  /**
   *
   * @param {Object} user
   * @private
   */
  static _addMyselfData(user) {
    const currentUserId = AuthService.getCurrentUserId();
    if (!currentUserId) {
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
    const multiplier = EosImportance.getImportanceMultiplier();

    user.current_rate = (user.current_rate * multiplier);

    user.current_rate = user.current_rate.toFixed();
  }
}

module.exports = UserPostProcessor;