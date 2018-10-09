const CommentsPostProcessor = require('../../comments/service/comments-post-processor');
const UsersPostProcessor    = require('../../users/user-post-processor');
const OrgPostProcessor      = require('../../organizations/service/organization-post-processor');
const EosImportance = require('../../eos/eos-importance');
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

  /**
   *
   * @param {Object} post
   * @return {Promise<void>}
   */
  static async processOnePost(post) {

    // TODO - this is duplication
    // await this._addOrganizationPreviewData(model);
    // ProcessorApiResponse.processPostComments(model, currentUserId);

    // TODO - move to separate comments processor
    // if (model.comments) {
    //   OrganizationPostProcessor.processOneOrganizationInManyModels(model.comments);
    // }

    const multiplier = EosImportance.getImportanceMultiplier();
    post.current_rate = (post.current_rate * multiplier);
    post.current_rate = post.current_rate.toFixed();

    UsersPostProcessor.processModelAuthor(post);

    // const userPostActivity = currentUserActivity ? currentUserActivity.posts[model.id] : null;
    // await this.addMyselfData(model, currentUserId, userActivityData, userPostActivity);

    // if (model['organization']) {
    //   TODO - check why is duplication
      // OrganizationPostProcessor.processOneOrg(model['organization']);
    // }
  }
}

module.exports = ApiPostProcessor;