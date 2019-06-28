import UserInputSanitizer = require('../../api/sanitizers/user-input-sanitizer');
import CommentsModelProvider = require('../service/comments-model-provider');

class CommentsInputProcessor {
  public static process(body: any): void {
    UserInputSanitizer.sanitizeInputWithModelProvider(body, CommentsModelProvider.getCommentsRelatedFieldsSet());
  }
}

export = CommentsInputProcessor;
