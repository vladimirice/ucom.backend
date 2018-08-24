const models = require('../../models');
const db = models.sequelize;
const ActivityDictionary = require('./activity-types-dictionary');

class ActivityUserUserRepository {
  static getFollowActivityForUser(userIdFrom, userIdTo) {
    const sql = `SELECT * FROM activity_user_user 
                  WHERE 
                    user_id_from = ${userIdFrom}
                  AND
                    user_id_to = ${userIdTo}
                 `;

    db.query(sql).spread((results, metadata) => {
    const a = 0;
      // TODO
      // Results will be an empty array and metadata will contain the number of affected rows.
    })

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
}

module.exports = ActivityUserUserRepository;