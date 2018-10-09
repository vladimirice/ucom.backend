const CommentsPostProcessor = require('../../comments/service/comments-post-processor');
const UsersPostProcessor    = require('../../users/user-post-processor');
const OrgPostProcessor      = require('../../organizations/service/organization-post-processor');

class ApiPostProcessor {
  /**
   *
   * @param {Object[]} comments
   * @param {number} currentUserId
   */
  static processManyComments(comments, currentUserId) {
    const processedComments = CommentsPostProcessor.processManyComments(comments, currentUserId);

    processedComments.forEach(comment => {
      UsersPostProcessor.processModelAuthor(comment);

      if (comment.organization) {
        OrgPostProcessor.processOneOrgWithoutActivity(comment.organization);
      }
    });

    return processedComments;
  }

  /**
   *
   * @param {Object} comment
   * @param {number} currentUserId
   * @return {Object}
   */
  static processOneComment(comment, currentUserId) {
    const processed = this.processManyComments([comment], currentUserId);

    return processed[0];
  }

}

module.exports = ApiPostProcessor;