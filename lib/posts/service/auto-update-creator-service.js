"use strict";
const ucom_libs_common_1 = require("ucom.libs.common");
const PostsRepository = require("../posts-repository");
const UsersRepository = require("../../users/users-repository");
const UserPostProcessor = require("../../users/user-post-processor");
class AutoUpdateCreatorService {
    static async createUserToUser(transaction, userFrom, userIdTo, blockchainId, eventId) {
        const userFromPreview = UserPostProcessor.processOnlyUserForPreview(userFrom);
        const userToPreview = await UsersRepository.findOneByIdForPreview(userIdTo);
        UserPostProcessor.processOnlyUserItself(userToPreview);
        const jsonData = this.getUserToUserJsonData(userFromPreview, userToPreview, eventId);
        return PostsRepository.createAutoUpdate(transaction, userFrom.id, userFrom.id, ucom_libs_common_1.EntityNames.USERS, blockchainId, jsonData);
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
