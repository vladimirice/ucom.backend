const userRepository = require('../repository');

class UserActivitySerializer {
  // @ts-ignore
  public static getActivityDataToCreateJob(transactionId, scope = null) {
    const payload = {
      id: transactionId,
    };

    return JSON.stringify(payload);
  }

  public static createJobWithOnlyEosJsV2Option(activityId: number): string {
    const options = {
      eosJsV2: true,
    };

    return this.createJobWithOptions(activityId, options);
  }

  /**
   *
   * @param {Object} message
   * @returns {Promise<string>}
   */
  static async getActivityDataToPushToBlockchain(message) {
    const signedTransaction =
      await userRepository.Activity.getSignedTransactionByActivityId(message.id);

    if (!signedTransaction) {
      throw new Error(`There is no activity data with id: ${message.id}`);
    }

    return JSON.parse(signedTransaction);
  }

  private static createJobWithOptions(activityId: number, options): string {
    const payload = {
      options,
      id: activityId,
    };

    return JSON.stringify(payload);
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

export = UserActivitySerializer;
