"use strict";
const userRepository = require('../repository');
class UserActivitySerializer {
    // @ts-ignore
    static getActivityDataToCreateJob(transactionId, scope = null) {
        const payload = {
            id: transactionId,
        };
        return JSON.stringify(payload);
    }
    static createJobWithOnlyEosJsV2Option(activityId) {
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
        const signedTransaction = await userRepository.Activity.getSignedTransactionByActivityId(message.id);
        if (!signedTransaction) {
            throw new Error(`There is no activity data with id: ${message.id}`);
        }
        return JSON.parse(signedTransaction);
    }
    static createJobWithOptions(activityId, options) {
        const payload = {
            options,
            id: activityId,
        };
        return JSON.stringify(payload);
    }
}
module.exports = UserActivitySerializer;
