const CommentsPostProcessor = require('../../comments/service/comments-post-processor');
const UsersPostProcessor    = require('../../users/user-post-processor');
const OrgPostProcessor      = require('../../organizations/service/organization-post-processor');
const PostsPostProcessor    = require('../../posts/service').PostProcessor;
const ContentTypeDictionary    = require('uos-app-transaction').ContentTypeDictionary;
const InteractionTypeDictionary   = require('uos-app-transaction').InteractionTypeDictionary;

const EosImportance = require('../../eos/eos-importance');

/**
 * There are three types of processing
 *
 * 1. Process one entity       - for detail entity info - max amount of processing
 * 2. Process list of entities - less processing
 * 3. Tiny entities            - even less processing
 *
 * Processing might depend on entity type, tiny entities requires very small processing amount
 *
 * 1. Process list of entities - less processing than
 * 2. Process one entity - for detail entity info - max amount of processing
 *
 * 3. Tiny
 */

class ApiPostProcessor {


  /**
   *
   * @param {Object[]} posts
   * @param {number} currentUserId
   * @param {Object} currentUserActivity
   * @return {Array}
   */
  static processManyPosts(posts, currentUserId, currentUserActivity) {
    let result = [];

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const data = this.processOnePostForList(post, currentUserId, currentUserActivity);

      result.push(data);
    }

    return result;
  }

  /**
   *
   * @param {Object} post
   * @param {number} currentUserId
   * @param {Object} currentUserActivity
   * @return {*}
   */
  static processOnePostForList(post, currentUserId, currentUserActivity) {
    UsersPostProcessor.processModelAuthorForListEntity(post.User);
    this._normalizeMultiplier(post);

    if (currentUserId) {
      const userPostActivity = currentUserActivity ? currentUserActivity.posts[post.id] : null;
      this.addMyselfDataForPost(post, currentUserId, userPostActivity);
    }

    if (post.organization) {
      OrgPostProcessor.processOneOrgWithoutActivity(post.organization);
    }
    PostsPostProcessor.processPostInCommon(post);

    // TOD return is not required here
    return post;
  }

  static processOnePostFully(post, currentUserId, currentUserPostActivity, activityData, orgTeamMembers) {
    if (post.comments) {
      this.processManyComments(post.comments, currentUserId);
    }

    UsersPostProcessor.processModelAuthor(post, currentUserId, activityData);
    this._normalizeMultiplier(post);

    if (currentUserId) {
      const userPostActivity = currentUserPostActivity && currentUserPostActivity.posts ? currentUserPostActivity.posts[post.id] : null;
      this.addMyselfDataForPost(post, currentUserId, userPostActivity, orgTeamMembers);
    }

    OrgPostProcessor.processOneOrg(post.organization);
    PostsPostProcessor.processPostInCommon(post);

    // TODO refactor post offer flatteinig
    const excludePostOffer = [
      'id',
    ];

    if (post.post_offer) {
      for (const field in post.post_offer) {
        if (!post.post_offer.hasOwnProperty(field)) {
          continue;
        }

        if (excludePostOffer.indexOf(field) !== -1) {
          continue;
        }

        if (post.hasOwnProperty(field)) {
          throw new Error(`Post itself has property ${field} but it must be taken from post_offer`);
        }

        post[field] = post.post_offer[field];
      }

      delete post.post_offer;
    }

    // TODO not tested, not required for list
    let teamMembers = [];
    const postUsersTeam = post.post_users_team;

    if (postUsersTeam) {
      postUsersTeam.forEach(teamMember => {
        UsersPostProcessor.processUser(teamMember.User);
        teamMembers.push(teamMember.User);
      });
    }

    post.post_users_team = teamMembers;

    if (post.post_type_id === ContentTypeDictionary.getTypeDirectPost()) {
      PostsPostProcessor.processDirectPost(post);
    }

    return post;
  }

  /**
   *
   * @param {Object[]} comments
   * @param {number} currentUserId
   */
  static processManyComments(comments, currentUserId) {
    const processedComments = CommentsPostProcessor.processManyComments(comments, currentUserId);

    processedComments.forEach(comment => {
      UsersPostProcessor.processModelAuthorForListEntity(comment.User);

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
   * @param {Object} model
   * @private
   */
  static _normalizeMultiplier(model) {
    if (typeof model.current_rate === 'undefined') {
      return;
    }

    const multiplier = EosImportance.getImportanceMultiplier();

    model.current_rate = (model.current_rate * multiplier);

    model.current_rate = +model.current_rate.toFixed();
  }


  /**
   *
   * @param {Object} model
   * @param {number} currentUserId
   * @param {Object[]|null}userPostActivity
   * @param {number[]} orgTeamMembers
   */
  static addMyselfDataForPost(model, currentUserId, userPostActivity, orgTeamMembers = []) {
    if (!currentUserId) {
      return;
    }

    let myselfVote = 'no_vote';
    let join = false;
    let organization_member = false;

    if (model.organization) {
      if (currentUserId === model.organization.user_id) {
        organization_member = true;
      } else {
        organization_member = orgTeamMembers.indexOf(currentUserId) !== -1;
      }
    }

    if (userPostActivity) {
      for (let i = 0; i < userPostActivity.length; i++) {
        const current = userPostActivity[i];

        if (InteractionTypeDictionary.isJoinActivity(current)) {
          join = true;
          continue;
        }

        if (InteractionTypeDictionary.isUpvoteActivity(current)) {
          myselfVote = 'upvote';
        } else if (InteractionTypeDictionary.getDownvoteId() === current.activity_type_id) {
          myselfVote = 'downvote';
        }
      }
    }

    model.myselfData = {
      myselfVote,
      join,
      organization_member
    };
  }
}

module.exports = ApiPostProcessor;