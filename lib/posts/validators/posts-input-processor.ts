import UserInputSanitizer = require('../../api/sanitizers/user-input-sanitizer');
import PostsModelProvider = require('../service/posts-model-provider');

class PostsInputProcessor {
  public static process(body: any): void {
    UserInputSanitizer.sanitizeInputWithModelProvider(body, PostsModelProvider.getPostRelatedFieldsSet());
  }
}

export = PostsInputProcessor;
