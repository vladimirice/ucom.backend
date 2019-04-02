"use strict";
const errors_1 = require("../../api/errors");
const OneUserInputValidator = require("../validator/one-user-input-validator");
const UsersRepository = require("../users-repository");
class OneUserInputProcessor {
    static async getUserIdByFilters(filters) {
        const userId = filters.user_id;
        const userIdentity = filters.user_identity;
        if (userId && userIdentity) {
            throw new errors_1.BadRequestError(`Please provide either user_id or user_identity filter. Provided filters: ${JSON.stringify(filters)}`);
        }
        if (!userId && !userIdentity) {
            throw new errors_1.BadRequestError(`Please provide user_id or user_identity filter. Provided filters: ${JSON.stringify(filters)}`);
        }
        if (userIdentity) {
            return OneUserInputProcessor.getUserIdByIdentity(userIdentity);
        }
        return userId;
    }
    static async getUserIdByIdentity(identity) {
        if (OneUserInputValidator.doesIdentityLooksLikeId(identity)) {
            return +identity;
        }
        const user = await UsersRepository.findOneByAccountNameAsObject(identity);
        if (!user) {
            throw new errors_1.BadRequestError(`There is no user with account_name: ${identity}`);
        }
        return +user.id;
    }
}
module.exports = OneUserInputProcessor;
