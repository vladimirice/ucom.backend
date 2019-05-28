"use strict";
const errors_1 = require("../errors");
class DiServiceLocator {
    static getCurrentUserOrException(req) {
        if (!req.currentUser) {
            throw new errors_1.AppError('User must be defined or AuthMiddleware should be used beforehand');
        }
        return req.currentUser;
    }
    static getCurrentUserIdOrException(req) {
        const currentUser = this.getCurrentUserOrException(req);
        return currentUser.id;
    }
    static getCurrentUserIdOrNull(req) {
        const currentUser = req.currentUser;
        if (currentUser) {
            return currentUser.id;
        }
        return null;
    }
}
module.exports = DiServiceLocator;
