"use strict";
const ucom_libs_common_1 = require("ucom.libs.common");
const PostsRepository = require("../posts-repository");
const UsersRepository = require("../../users/users-repository");
const UserPostProcessor = require("../../users/user-post-processor");
const PostsCurrentParamsRepository = require("../repository/posts-current-params-repository");
const PostStatsRepository = require("../stats/post-stats-repository");
class AutoUpdateCreatorService {
    static async createUserToUser(transaction, userFrom, userIdTo, blockchainId, eventId) {
        const userFromPreview = UserPostProcessor.processOnlyUserForPreview(userFrom);
        const userToPreview = await UsersRepository.findOneByIdForPreview(userIdTo);
        UserPostProcessor.processOnlyUserItself(userToPreview);
        const jsonData = this.getUserToUserJsonData(userFromPreview, userToPreview, eventId);
        const newPostId = await PostsRepository.createAutoUpdate(transaction, userFrom.id, userFrom.id, ucom_libs_common_1.EntityNames.USERS, blockchainId, jsonData);
        await Promise.all([
            PostStatsRepository.createNewByKnex(newPostId, transaction),
            PostsCurrentParamsRepository.insertRowForNewEntityWithTransaction(newPostId, transaction),
        ]);
    }
    static getUserToUserJsonData(userFrom, userTo, eventId) {
        const data = {
            User: userFrom,
        };
        const targetEntity = {
            User: userTo,
        };
        return this.getJsonData(data, targetEntity, eventId);
    }
    static getJsonData(data, target_entity, eventId) {
        return {
            data,
            target_entity,
            meta_data: {
                eventId,
            },
        };
    }
}
module.exports = AutoUpdateCreatorService;
