const CommentsPostProcessor             = require('../../comments/service/comments-post-processor');
const UsersPostProcessor                = require('../../users/user-post-processor');
const OrgPostProcessor                  = require('../../organizations/service/organization-post-processor');

const PostsPostProcessor    = require('../../posts/service').PostProcessor;
const InteractionTypeDictionary   = require('uos-app-transaction').InteractionTypeDictionary;

const EosImportance = require('../../eos/eos-importance');

class ApiPostProcessor {

  /**
   *
   * @param {Object} model
   * @param {number} currentUserId
   * @param {Object[]} activityData
   */
  static processOneOrgFully(model, currentUserId, activityData) {
    OrgPostProcessor.processOneOrg(model, activityData);
    OrgPostProcessor.addMyselfDataToOneOrg(model, currentUserId, activityData);

    UsersPostProcessor.processModelAuthor(model, currentUserId);
    UsersPostProcessor.processUsersTeamArray(model);
  }

  /**
  * @param {Object} models
  */
  static processManyNotificationsForResponse(models) {
    models.forEach(model => {
      this.processOneNotificationForResponse(model);
    })
  }


  /**
   *
   * @param {Object} model
   */
  static processOneOrgUsersTeamInvitation(model) {
    OrgPostProcessor.processOneOrgWithoutActivity(model.data.organization);
    UsersPostProcessor.processModelAuthorForListEntity(model.data.User);
    UsersPostProcessor.processModelAuthorForListEntity(model.target_entity.User);
  }

  /**
   *
   * @param {Object} model
   */
  static processOneUserFollowsOrgNotification(model) {
    UsersPostProcessor.processModelAuthorForListEntity(model.data.User);
    OrgPostProcessor.processOneOrgWithoutActivity(model.target_entity.organization);
  }

  /**
   *
   * @param {Object} model
   */
  static processOneUserFollowsOtherUserNotification(model) {
    UsersPostProcessor.processModelAuthorForListEntity(model.data.User);
    UsersPostProcessor.processModelAuthorForListEntity(model.target_entity.User);
  }

  /**
   *
   * @param {Object} model
   */
  static processUserVotesPostOfOtherUser(model) {
    UsersPostProcessor.processModelAuthorForListEntity(model.data.User);

    this.processOnePostItselfForList(model.target_entity.post);
    UsersPostProcessor.processModelAuthorForListEntity(model.target_entity.post.User);
  }

  /**
   *
   * @param {Object} model
   */
  static processUserVotesCommentOfOtherUser(model) {
    UsersPostProcessor.processModelAuthorForListEntity(model.data.User);

    CommentsPostProcessor.processManyComments([model.target_entity.comment]);
    UsersPostProcessor.processModelAuthorForListEntity(model.target_entity.comment.User);
    this.processOnePostItselfForList(model.target_entity.comment.post);
  }

  /**
   *
   * @param {Object} model
   */
  static processUserVotesCommentOfOrg(model) {
    UsersPostProcessor.processModelAuthorForListEntity(model.data.User);

    CommentsPostProcessor.processManyComments([model.target_entity.comment]);
    UsersPostProcessor.processModelAuthorForListEntity(model.target_entity.comment.User);
    this.processOnePostItselfForList(model.target_entity.comment.post);

    OrgPostProcessor.processOneOrgWithoutActivity(model.target_entity.comment.organization)
  }

  /**
   *
   * @param {Object} model
   */
  static processUserVotesPostOfOrg(model) {
    UsersPostProcessor.processModelAuthorForListEntity(model.data.User);

    this.processOnePostItselfForList(model.target_entity.post);
    UsersPostProcessor.processModelAuthorForListEntity(model.target_entity.post.User);

    OrgPostProcessor.processOneOrgWithoutActivity(model.target_entity.post.organization);
  }

  /**
   *
   * @param {Object} model
   */
  static processUserCreatesCommentForPost(model) {
    CommentsPostProcessor.processManyComments([model.data.comment]);
    UsersPostProcessor.processModelAuthorForListEntity(model.data.comment.User);

    this.processOnePostItselfForList(model.data.comment.post);

    this.processOnePostForList(model.target_entity.post);
  }

  /**
   *
   * @param {Object} model
   */
  static processUserCreatesCommentForOrgPost(model) {
    CommentsPostProcessor.processManyComments([model.data.comment]);
    UsersPostProcessor.processModelAuthorForListEntity(model.data.comment.User);
    this.processOnePostItselfForList(model.data.comment.post);

    this.processOnePostForList(model.target_entity.post); // This also process User
    OrgPostProcessor.processOneOrgWithoutActivity(model.target_entity.post.organization);
  }

  /**
   *
   * @param {Object} model
   */
  static processUserCreatesCommentForOrgComment(model) {
    CommentsPostProcessor.processManyComments([model.data.comment]);
    UsersPostProcessor.processModelAuthorForListEntity(model.data.comment.User);

    CommentsPostProcessor.processManyComments([model.target_entity.comment]);
    UsersPostProcessor.processModelAuthorForListEntity(model.target_entity.comment.User);
    OrgPostProcessor.processOneOrgWithoutActivity(model.target_entity.comment.organization);
  }

  /**
   *
   * @param {Object} model
   */
  static processUserCreatesDirectPostForOtherUser(model) {
    this.processOnePostForList(model.data.post); // This also process User

    UsersPostProcessor.processModelAuthorForListEntity(model.target_entity.User);
  }

  /**
   *
   * @param {Object} model
   */
  static processUserCreatesDirectPostForOrg(model) {
    this.processOnePostForList(model.data.post); // This also process User

    OrgPostProcessor.processOneOrgWithoutActivity(model.target_entity.organization);
    UsersPostProcessor.processModelAuthorForListEntity(model.target_entity.organization.User);
  }

  /**
   *
   * @param {Object} model
   */
  static processUserCreatesCommentForComment(model) {
    CommentsPostProcessor.processManyComments([model.data.comment]);
    UsersPostProcessor.processModelAuthorForListEntity(model.data.comment.User);

    this.processOnePostItselfForList(model.data.comment.post);

    CommentsPostProcessor.processManyComments([model.target_entity.comment]);
    UsersPostProcessor.processModelAuthorForListEntity(model.target_entity.comment.User);

    this.processOnePostItselfForList(model.target_entity.comment.post);
  }

  /**
   *
   * @param {Object} model
   */
  static processOneNotificationForResponse(model) {
    if (!model.json_body) {
      throw new Error('Malformed notification. No json_body. Full model is: ', JSON.stringify(model, null, 2));
    }

    if (model.data || model.target_entity) {
      throw new Error('Malformed notification. Data or target_entity exist but must not: ', JSON.stringify(model, null, 2))
    }

    model.data          = model.json_body.data;
    model.target_entity = model.json_body.target_entity;

    delete model.json_body;
  }

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
  static processOnePostForList(post, currentUserId = null, currentUserActivity = null) {
    this._normalizeMultiplier(post);

    UsersPostProcessor.processModelAuthorForListEntity(post.User);

    if (currentUserId) {
      const userPostActivity = currentUserActivity ? currentUserActivity.posts[post.id] : null;
      this._addMyselfDataForPost(post, currentUserId, userPostActivity);
    }

    if (post.organization) {
      OrgPostProcessor.processOneOrgWithoutActivity(post.organization);
    }
    PostsPostProcessor.processPostInCommon(post);

    // TOD return is not required here
    return post;
  }

  /**
   *
   * @param {Object} post
   */
  static processOnePostItselfForList(post) {
    this._normalizeMultiplier(post);
    PostsPostProcessor.processPostInCommon(post)
  }

  /**
   *
   * @param {Object} post
   * @param {number} currentUserId
   * @param {Object} currentUserPostActivity
   * @param {Object} activityData
   * @param {number[]} orgTeamMembers
   * @return {*}
   */
  static processOnePostFully(post, currentUserId, currentUserPostActivity, activityData, orgTeamMembers) {
    this._normalizeMultiplier(post);

    this.processManyCommentsOfEntity(post, currentUserId);

    UsersPostProcessor.processModelAuthor(post, currentUserId, activityData);

    if (currentUserId) {
      const userPostActivity = currentUserPostActivity ? currentUserPostActivity.posts[post.id] : null;
      this._addMyselfDataForPost(post, currentUserId, userPostActivity, orgTeamMembers);
    }

    OrgPostProcessor.processOneOrg(post.organization);
    PostsPostProcessor.processPostInCommon(post);

    this._processPostTeam(post);

    return post;
  }

  /**
   *
   * @param {Object} entity
   * @param {number} currentUserId
   */
  static processManyCommentsOfEntity(entity, currentUserId) {
    if (entity.comments) {
      this.processManyComments(entity.comments, currentUserId);
    }
  }

  /**
   *
   * @param {Object} users
   * @param {number | null} currentUserId
   */
  static processUsersAfterQuery(users, currentUserId = null) {
    users.forEach(user => {
      UsersPostProcessor.processUser(user, currentUserId)
    });
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
  static _addMyselfDataForPost(model, currentUserId, userPostActivity, orgTeamMembers = []) {
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

  /**
   *
   * @param {Object} post
   * @private
   */
  static _processPostTeam(post) {
    let teamMembers = [];
    const postUsersTeam = post.post_users_team;

    if (postUsersTeam) {
      postUsersTeam.forEach(teamMember => {
        UsersPostProcessor.processUser(teamMember.User);
        teamMembers.push(teamMember.User);
      });
    }

    post.post_users_team = teamMembers;
  }

}

module.exports = ApiPostProcessor;