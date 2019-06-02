"use strict";
/* eslint-disable promise/no-callback-in-promise */
// tslint:disable-next-line:variable-name
const inversify_config_1 = require("../../config/inversify/inversify.config");
const authService = require('../auth/authService');
const userRepository = require('../users/users-repository');
const { AppError } = require('../../lib/api/errors');
module.exports = (req, res, next) => {
    req.container = inversify_config_1.diContainer;
    const currentUserId = authService.extractCurrentUserByToken(req);
    if (!currentUserId) {
        next();
    }
    else {
        userRepository.findOneById(currentUserId).then((user) => {
            // eslint-disable-next-line promise/always-return
            if (!user) {
                throw new AppError(`There is no user with ID ${currentUserId} but ID is provided in token`, 500);
            }
            req.current_user_id = currentUserId;
            req.currentUser = user;
            next();
        }).catch(next);
    }
};
