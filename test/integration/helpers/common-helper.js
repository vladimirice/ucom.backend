const UsersHelper       = require('./users-helper');
const OrgHelper         = require('./organizations-helper');
const CommentsHelper    = require('./comments-helper');

class CommonHelper {
  /**
   *
   * @param {Object[]} comments
   */
  static checkManyCommentsPreviewWithRelations(comments) {
    comments.forEach(comment => {
      this.checkOneCommentPreviewWithRelations(comment);
    });
  }

  /**
   *
   * @param {Object} comment
   */
  static checkOneCommentPreviewWithRelations(comment) {
    CommentsHelper.checkOneCommentPreviewFields(comment);
    UsersHelper.checkUserPreview(comment.User);

    if (comment.organization) {
      OrgHelper.checkOneOrganizationPreviewFields(comment.organization);
    }
  }
}

module.exports = CommonHelper;