"use strict";
class DiServiceLocator {
    static getCurrentUserOrException(req) {
        const service = req.container.get('current-user');
        return service.getUserOrException();
    }
    static getCurrentUserIdOrException(req) {
        const service = req.container.get('current-user');
        return service.getCurrentUserIdOrException();
    }
    static getPostsService(req) {
        return req.container.get('post-service');
    }
    static getOrganizationsService(req) {
        return req.container.get('organizations-service');
    }
}
module.exports = DiServiceLocator;
