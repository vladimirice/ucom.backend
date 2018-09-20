const UserRepository = require('../repository');

const ACTIVITY__USER_USER = 'activity_user_user';

class UserActivitySerializer {
  /**
   *
   * @param {number} transactionId
   * @returns {string}
   */
  static getActivityDataToCreateJob(transactionId) {
    const payload = {
      'id': transactionId,
      'scope': ACTIVITY__USER_USER,
    };

    return JSON.stringify(payload);
  }

  /**
   *
   * @param {Object} message
   * @returns {Promise<string>}
   */
  static async getActivityDataToPushToBlockchain(message) {
    let signedTransaction;

    switch (message.scope) {
      case ACTIVITY__USER_USER:
        signedTransaction = await UserRepository.ActivityUserUser.getSignedTransactionByActivityId(message.id);
        break;
      default:
        throw new Error(`Unsupported scope: ${message.scope}`);
    }

    return JSON.parse(signedTransaction);
  }

  // static async getPostDataForIpfs(postJobPayload) {
  //   const postId = postJobPayload.id;
  //   const postTypeId = postJobPayload.post_type_id;
  //
  //   const data = await PostRepository.findOneForIpfs(postId, postTypeId);
  //
  //   data['created_at'] = parseInt(moment(data['created_at']).valueOf() / 1000);
  //   data['updated_at'] = parseInt(moment(data['updated_at']).valueOf() / 1000);
  //
  //   return data;
  // }
}

module.exports = UserActivitySerializer;