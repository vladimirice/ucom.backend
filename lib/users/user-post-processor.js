const AuthService = require('../auth/authService');

class UserPostProcessor {
  static addMyselfData(user) {
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

}

module.exports = UserPostProcessor;