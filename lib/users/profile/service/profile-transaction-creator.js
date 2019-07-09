"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const lodash_1 = __importDefault(require("lodash"));
const errors_1 = require("../../../api/errors");
const UserActivityService = require("../../user-activity-service");
class ProfileTransactionCreator {
    static async createRegistrationProfileTransaction(request, 
    // @ts-ignore
    currentUser) {
        const { body } = request;
        if (lodash_1.default.isEmpty(body) || !body.signed_transaction) {
            throw new errors_1.BadRequestError('It is required to provide a signed_transaction');
        }
        const activity = await UserActivityService.createForUserCreatesProfile(body.signed_transaction, currentUser.id);
        await UserActivityService.sendPayloadToRabbitEosV2(activity);
    }
}
module.exports = ProfileTransactionCreator;
