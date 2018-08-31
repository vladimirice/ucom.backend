const models = require('../../models');
const db = models.sequelize;
const ActivityDictionary = require('./activity-types-dictionary');


class ActivityUserUserRepository {
  /**
   * @param {number} user_id_from
   * @param {number} user_id_to
   * @param {number} activity_type_id
   * @returns {Promise<void>}
   */
  static async createNewActivity(user_id_from, user_id_to, activity_type_id) {
    const data = {
      user_id_from,
      user_id_to,
      activity_type_id
    };

    return await this.getModel().create(data);
  }

  // TODO #performance - check EXISTS only
  static async doesUserFollowUser(userIdFrom, userIdTo) {
    const result = await this.getFollowActivityForUser(userIdFrom, userIdTo);

    return !!result;
  }

  static async getFollowActivityForUser(userIdFrom, userIdTo) {
    return await ActivityUserUserRepository.getModel()
      .findOne({
        where: {
          user_id_from: userIdFrom,
          user_id_to: userIdTo,
          activity_type_id: ActivityDictionary.getFollowId(),
        },
        raw: true
      });
  }

  static getModel() {
    return models['activity_user_user'];
  }
}

module.exports = ActivityUserUserRepository;