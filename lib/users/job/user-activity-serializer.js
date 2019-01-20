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
}
module.exports = UserActivitySerializer;
