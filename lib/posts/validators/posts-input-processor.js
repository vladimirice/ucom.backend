"use strict";
const UserInputSanitizer = require("../../api/sanitizers/user-input-sanitizer");
const PostsModelProvider = require("../service/posts-model-provider");
class PostsInputProcessor {
    static process(body) {
        UserInputSanitizer.sanitizeInputWithModelProvider(body, PostsModelProvider.getPostRelatedFieldsSet());
    }
}
module.exports = PostsInputProcessor;
