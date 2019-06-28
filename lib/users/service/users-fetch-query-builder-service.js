"use strict";
const errors_1 = require("../../api/errors");
const UsersRepository = require("../users-repository");
const UsersActivityFollowRepository = require("../repository/users-activity/users-activity-follow-repository");
const UsersActivityTrustRepository = require("../repository/users-activity/users-activity-trust-repository");
const UsersActivityReferralRepository = require("../../affiliates/repository/users-activity-referral-repository");
class UsersFetchQueryBuilderService {
    static getPromisesByActivityType(query, userId, params) {
        const type = query.activity;
        if (!type) {
            throw new errors_1.BadRequestError('Please specify an activity_type filter');
        }
        let promises;
        switch (query.activity) {
            case 'followed_by':
                promises = [
                    UsersRepository.findAllWhoFollowsUser(userId, params),
                    UsersActivityFollowRepository.countUsersThatFollowUser(userId),
                ];
                break;
            case 'I_follow':
                promises = [
                    UsersRepository.findUsersIFollow(userId, params),
                    UsersActivityFollowRepository.countUsersIFollow(userId),
                ];
                break;
            case 'trusted_by':
                promises = [
                    UsersRepository.findAllWhoTrustsUser(userId, params),
                    UsersActivityTrustRepository.countUsersThatTrustUser(userId),
                ];
                break;
            case 'referrals':
                promises = [
                    UsersRepository.findUserReferrals(userId, params),
                    UsersActivityReferralRepository.countReferralsOfUser(userId),
                ];
                break;
            default:
                throw new errors_1.BadRequestError(`Unsupported activity_type: ${type}`);
        }
        return promises;
    }
}
module.exports = UsersFetchQueryBuilderService;
