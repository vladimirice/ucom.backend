const models = require('../../models');
const db = models.sequelize;


class ActivityTypesDictionary {
  static getFollowId() {
    return 1;
  }
}

module.exports = ActivityTypesDictionary;