const CommentsPostProcessor = require('../../comments/service/comments-post-processor');
const UsersPostProcessor    = require('../../users/user-post-processor');
const OrgPostProcessor      = require('../../organizations/service/organization-post-processor');
const PostsPostProcessor    = require('../../posts/service').PostProcessor;
const ContentTypeDictionary    = require('uos-app-transaction').ContentTypeDictionary;

const EosImportance = require('../../eos/eos-importance');

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
      const data = this.processOnePost(post, currentUserId, currentUserActivity);

      result.push(data);
    }

    return result;
  }

  static processOnePost(post, currentUserId, currentUserActivity) {

    // TODO post itself processing - to separate processor
    // TODO process post comments if
    // if (!this.isDirectPost(model)) {
    //   ProcessorApiResponse.processPostComments(model, currentUserId);
    // }
    // if (model.comments) {
    //   OrganizationPostProcessor.processOneOrganizationInManyModels(model.comments);
    // }

    UsersPostProcessor.processModelAuthor(post);
    this._normalizeMultiplier(post);

    // TODO
    // const userPostActivity = currentUserActivity ? currentUserActivity.posts[post.id] : null;

    // TODO
    // await this.addMyselfDataForPost(model, currentUserId, userActivityData, userPostActivity);

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

    // TODO not tested
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

  // static async addMyselfDataForPost(model, currentUserId, userActivityData, userPostActivity = null) {
  //   const author = model['User'];
  //
  //   if (!this.isDirectPost(model)) {
  //     UserPostProcessor.processUser(author, currentUserId, userActivityData);
  //   }
  //
  //   if (!currentUserId) {
  //     return;
  //   }
  //
  //   let myselfVote = 'no_vote';
  //   let join = false;
  //   let organization_member = false;
  //
  //   // TODO #opt. Here is a point of a lot of single DB requests
  //   if (model.organization) {
  //     const isTeamMember = await UsersTeamRepository.isTeamMember(OrganizationsModelProvider.getEntityName(), model.organization.id, currentUserId);
  //
  //     if (model.organization.user_id === currentUserId || isTeamMember) {
  //       organization_member = true;
  //     }
  //   }
  //
  //   if (userPostActivity) {
  //     for (let i = 0; i < userPostActivity.length; i++) {
  //       const current = userPostActivity[i];
  //
  //       if (InteractionTypeDictionary.isJoinActivity(current)) {
  //         join = true;
  //         continue;
  //       }
  //
  //       if (InteractionTypeDictionary.isUpvoteActivity(current)) {
  //         myselfVote = 'upvote';
  //       } else if (InteractionTypeDictionary.getDownvoteId() === current.activity_type_id) {
  //         myselfVote = 'downvote';
  //       }
  //     }
  //   }
  //
  //   model.myselfData = {
  //     myselfVote,
  //     join,
  //     organization_member
  //   };
  // }
}

module.exports = ApiPostProcessor;