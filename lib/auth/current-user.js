"use strict";
const errors_1 = require("../api/errors");
class CurrentUser {
    constructor() {
        this.user = null;
        this.id = null;
    }
    /**
     *
     * @param {Object} value
     */
    setCurrentUser(value) {
        this.user = value;
        this.setCurrentUserId(value.id);
    }
    setCurrentUserId(value) {
        this.id = value;
    }
    isCurrentUser() {
        return !!this.id;
    }
    getUser() {
        return this.user;
    }
    getUserOrException() {
        if (!this.user) {
            throw new errors_1.AppError('User must be defined or AuthMiddleware should be used beforehand');
        }
        return this.user;
    }
    getId() {
        return this.id;
    }
    getCurrentUserId() {
        return this.id;
    }
    getCurrentUserIdOrException() {
        const currentUser = this.getUserOrException();
        return currentUser.id;
    }
}
module.exports = CurrentUser;
