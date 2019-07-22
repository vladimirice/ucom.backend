import { IActivityOptions } from '../../eos/interfaces/activity-interfaces';

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

  public static createJobWithOptions(activityId: number, options: IActivityOptions): string {
    const payload = {
      options,
      id: activityId,
    };

    return JSON.stringify(payload);
  }
}

export = UserActivitySerializer;
