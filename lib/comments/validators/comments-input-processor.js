"use strict";
const UserInputSanitizer = require("../../api/sanitizers/user-input-sanitizer");
const CommentsModelProvider = require("../service/comments-model-provider");
class CommentsInputProcessor {
    static process(body) {
        UserInputSanitizer.sanitizeInputWithModelProvider(body, CommentsModelProvider.getCommentsRelatedFieldsSet());
    }
}
module.exports = CommentsInputProcessor;
