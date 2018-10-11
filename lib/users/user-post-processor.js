const EosImportance = require('../eos/eos-importance');
const _ = require('lodash');

const UsersRepository = require('./users-repository');

class UserPostProcessor {
  /**
   *
   * @param {Object} model
   * @param {number} currentUserId
   * @param {Object} userActivityData
   */
  static processModelAuthor(model, currentUserId, userActivityData = null) {
    if (!model.User) {
      return;
    }

    this.processUser(model.User, currentUserId, userActivityData)
  }

  /**
   *
   * @param {Object} user
   */
  static processModelAuthorForListEntity(user) {
    this._normalizeMultiplier(user);
    this._deleteSensitiveData(user);
  }

  /**
   *
   * @param {Object} model
   */
  static processUsersTeamArray(model) {
    if (!model.users_team || _.isEmpty(model.users_team)) {
      return;
    }


    const processedUsersTeam = model.users_team.map(record => {
      this.processUser(record.User);

      return record.User;
    });

    model.users_team = processedUsersTeam;
  }

  /**
   *
   * @param {Object} user to process
   * @param {number|null} currentUserId - logged user ID
   * @param {Object} activityData
   */
  static processUser(user, currentUserId = null, activityData = null) {
    if (!user) {
      return;
    }

    if (activityData) {
      this._addIFollowAndMyFollowers(user, activityData);
      this._addMyselfDataToSingleUser(user, activityData, currentUserId);
    }

    this._normalizeMultiplier(user);
    this._deleteSensitiveData(user);
    this._processFollowers(user);
  }

  /**
   *
   * @param {Object} user
   * @param {Object} activityData
   * @private
   */
  static _addIFollowAndMyFollowers(user, activityData) {
    const attributesToPick = UsersRepository.getModel().getFieldsForPreview();

    user['I_follow'] = [];
    user['followed_by'] = [];

    activityData.forEach(activity => {
      const data = _.pick(activity, attributesToPick);
      user[activity.case].push(data);
    });
  }

  /**
   *
   * @param {Object} user
   * @param {Object} activityData
   * @param {number} currentUserId
   * @private
   */
  static _addMyselfDataToSingleUser(user, activityData, currentUserId) {
    if (!currentUserId) {
      return;
    }

    let myselfData = {
      follow: false,
      myFollower: false,
    };

    activityData.forEach(activity => {
      if (activity.id === currentUserId) {
        if (activity.case === 'followed_by') {
          myselfData.follow = true;
        } else if (activity.case === 'I_follow') {
          myselfData.myFollower = true;
        }
      }
    });

    user.myselfData = myselfData;
  }

  /**
   *
   * @param {Object[]} users
   * @param {Object} activityData
   */
  static addMyselfDataByActivityArrays(users, activityData) {
    users.forEach(user => {
      let myselfData = {
        follow: false,
        myFollower: false,
      };

      if (activityData.IFollow.indexOf(user.id) !== -1) {
        myselfData.follow = true;
      }
      if (activityData.myFollowers.indexOf(user.id) !== -1) {
        myselfData.myFollower = true;
      }

      user.myselfData = myselfData;
    })
  }

  /**
   *
   * @param {Object} user
   * @private
   */
  static _processFollowers(user) {
    if (user['I_follow']) {
      user['I_follow'].forEach(follower => {
        this._normalizeMultiplier(follower);
      });
    }

    if (user['followed_by']) {
      user['followed_by'].forEach(follower => {
        this._normalizeMultiplier(follower);
      });
    }
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
   * @deprecated
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

    if (!user['followed_by']) {
      user.myselfData = myselfData;
      return;
    }

    for(let i = 0; i < user['followed_by'].length; i++) {
      const activity = user['followed_by'][i];
      if(activity.user_id_from === currentUserId) {
        myselfData.follow = true;
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

    user.current_rate = +user.current_rate.toFixed();
  }
}

module.exports = UserPostProcessor;