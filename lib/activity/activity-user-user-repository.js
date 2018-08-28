const models = require('../../models');
const db = models.sequelize;
const ActivityDictionary = require('./activity-types-dictionary');


class ActivityUserUserRepository {

  static async getFollowActivityForUser(userIdFrom, userIdTo) {
    return await ActivityUserUserRepository.getModel()
      .findOne({
        where: {
          user_id_from: userIdFrom,
          user_id_to: userIdTo,
        },
        raw: true
      });
  }

  static async createFollow(userFromId, userToId) {
    const activityTypeId = ActivityDictionary.getFollowId();

    const sql = `INSERT INTO activity_user_user 
                  (activity_type_id, user_id_from, user_id_to) 
                VALUES (${activityTypeId}, ${userFromId}, ${userToId})`;

    db.query(sql).spread((results, metadata) => {

      if (metadata !== null) {

      }
      // TODO
      // Results will be an empty array and metadata will contain the number of affected rows.
    })
  }

  static getModel() {
    return models['activity_user_user'];
  }
}

module.exports = ActivityUserUserRepository;