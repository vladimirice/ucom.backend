"use strict";
const ucom_libs_common_1 = require("ucom.libs.common");
class CommentToEventIdService {
    static getUpdatingEventIdByPost(comment) {
        if (comment.organization_id === null) {
            return ucom_libs_common_1.EventsIdsDictionary.userUpdatesCommentFromAccount();
        }
        return ucom_libs_common_1.EventsIdsDictionary.userUpdatesCommentFromOrganization();
    }
}
module.exports = CommentToEventIdService;
