"use strict";
const ucom_libs_common_1 = require("ucom.libs.common");
const errors_1 = require("../../api/errors");
const CommentsPostProcessor = require("../../comments/service/comments-post-processor");
const TagsModelProvider = require("../../tags/service/tags-model-provider");
const PostsPostProcessor = require("../../posts/service/posts-post-processor");
const UserPostProcessor = require("../../users/user-post-processor");
const PAGE_FOR_EMPTY_METADATA = 1;
const PER_PAGE_FOR_EMPTY_METADATA = 10;
const moment = require('moment');
const commentsPostProcessor = require('../../comments/service/comments-post-processor');
const usersPostProcessor = require('../../users/user-post-processor');
const orgPostProcessor = require('../../organizations/service/organization-post-processor');
const postsPostProcessor = require('../../posts/service/posts-post-processor');
const usersModelProvider = require('../../users/users-model-provider');
const eosImportance = require('../../eos/eos-importance');
class ApiPostProcessor {
    static processManyTags(models) {
        models.forEach((model) => {
            model.entity_name = TagsModelProvider.getEntityName();
            this.processOneTag(model);
        });
    }
    static processOneTag(model) {
        this.normalizeMultiplier(model);
        this.formatModelDateTime(model);
    }
    /**
     *
     * @param {Object} model
     * @param {number} currentUserId
     * @param {Object[]} activityData
     */
    static processOneOrgFully(model, currentUserId, activityData) {
        orgPostProcessor.processOneOrg(model, activityData);
        orgPostProcessor.addMyselfDataToOneOrg(model, currentUserId, activityData);
        usersPostProcessor.processModelAuthor(model, currentUserId);
        usersPostProcessor.processUsersTeamArray(model);
        usersPostProcessor.processUsersArrayByKey(model, 'followed_by');
    }
    /**
    * @param {Object} models
    */
    static processManyNotificationsForResponse(models) {
        models.forEach((model) => {
            this.processOneNotificationForResponse(model);
        });
    }
    /**
     *
     * @param {Object} model
     */
    static processOneOrgUsersTeamInvitation(model) {
        orgPostProcessor.processOneOrgModelCard(model.data.organization);
        usersPostProcessor.processModelAuthorForListEntity(model.data.User);
        usersPostProcessor.processModelAuthorForListEntity(model.target_entity.User);
    }
    /**
     *
     * @param {Object} model
     */
    static processOneUserFollowsOrgNotification(model) {
        usersPostProcessor.processModelAuthorForListEntity(model.data.User);
        orgPostProcessor.processOneOrgModelCard(model.target_entity.organization);
    }
    /**
     *
     * @param {Object} model
     */
    static processOneUserFollowsOtherUserNotification(model) {
        usersPostProcessor.processModelAuthorForListEntity(model.data.User);
        usersPostProcessor.processModelAuthorForListEntity(model.target_entity.User);
    }
    /**
     *
     * @param {Object} model
     */
    static processOneUserTrustsOtherUserNotification(model) {
        UserPostProcessor.processModelAuthorForListEntity(model.data.User);
        UserPostProcessor.processModelAuthorForListEntity(model.target_entity.User);
    }
    /**
     *
     * @param {Object} model
     */
    static processUserVotesPostOfOtherUser(model) {
        UserPostProcessor.processModelAuthorForListEntity(model.data.User);
        this.processOnePostItselfForList(model.target_entity.post);
        UserPostProcessor.processModelAuthorForListEntity(model.target_entity.post.User);
    }
    /**
     *
     * @param {Object} model
     */
    static processUserVotesCommentOfOtherUser(model) {
        usersPostProcessor.processModelAuthorForListEntity(model.data.User);
        commentsPostProcessor.processManyComments([model.target_entity.comment]);
        usersPostProcessor.processModelAuthorForListEntity(model.target_entity.comment.User);
        this.processOnePostItselfForList(model.target_entity.comment.post);
    }
    /**
     *
     * @param {Object} model
     */
    static processUserVotesCommentOfOrg(model) {
        usersPostProcessor.processModelAuthorForListEntity(model.data.User);
        commentsPostProcessor.processManyComments([model.target_entity.comment]);
        usersPostProcessor.processModelAuthorForListEntity(model.target_entity.comment.User);
        this.processOnePostItselfForList(model.target_entity.comment.post);
        orgPostProcessor.processOneOrgModelCard(model.target_entity.comment.organization);
    }
    /**
     *
     * @param {Object} model
     */
    static processUserRepostsOtherUserPost(model) {
        this.processOnePostItselfForList(model.data.post);
        usersPostProcessor.processModelAuthorForListEntity(model.data.post.User);
        this.processOnePostItselfForList(model.target_entity.post);
        usersPostProcessor.processModelAuthorForListEntity(model.target_entity.post.User);
    }
    /**
     *
     * @param {Object} model
     */
    static processUserRepostsOrgPost(model) {
        this.processOnePostItselfForList(model.data.post);
        usersPostProcessor.processModelAuthorForListEntity(model.data.post.User);
        this.processOnePostItselfForList(model.target_entity.post);
        usersPostProcessor.processModelAuthorForListEntity(model.target_entity.post.User);
        orgPostProcessor.processOneOrgModelCard(model.target_entity.post.organization);
    }
    /**
     *
     * @param {Object} model
     */
    static processUserVotesPostOfOrg(model) {
        usersPostProcessor.processModelAuthorForListEntity(model.data.User);
        this.processOnePostItselfForList(model.target_entity.post);
        usersPostProcessor.processModelAuthorForListEntity(model.target_entity.post.User);
        orgPostProcessor.processOneOrgModelCard(model.target_entity.post.organization);
    }
    /**
     *
     * @param {Object} model
     */
    static processUserCreatesCommentForPost(model) {
        commentsPostProcessor.processManyComments([model.data.comment]);
        usersPostProcessor.processModelAuthorForListEntity(model.data.comment.User);
        this.processOnePostItselfForList(model.data.comment.post);
        this.processOnePostForList(model.target_entity.post);
    }
    /**
     *
     * @param {Object} model
     */
    static processUserCreatesCommentForOrgPost(model) {
        commentsPostProcessor.processManyComments([model.data.comment]);
        usersPostProcessor.processModelAuthorForListEntity(model.data.comment.User);
        this.processOnePostItselfForList(model.data.comment.post);
        this.processOnePostForList(model.target_entity.post); // This also process User
        orgPostProcessor.processOneOrgModelCard(model.target_entity.post.organization);
    }
    /**
     *
     * @param {Object} model
     */
    static processUserCreatesCommentForOrgComment(model) {
        commentsPostProcessor.processManyComments([model.data.comment]);
        usersPostProcessor.processModelAuthorForListEntity(model.data.comment.User);
        commentsPostProcessor.processManyComments([model.target_entity.comment]);
        usersPostProcessor.processModelAuthorForListEntity(model.target_entity.comment.User);
        orgPostProcessor.processOneOrgModelCard(model.target_entity.comment.organization);
    }
    /**
     *
     * @param {Object} model
     */
    static processUserCreatesDirectPostForOtherUser(model) {
        this.processOnePostForList(model.data.post); // This also process User
        usersPostProcessor.processModelAuthorForListEntity(model.target_entity.User);
    }
    /**
     *
     * @param {Object} model
     */
    // eslint-disable-next-line sonarjs/no-identical-functions
    static processUserMentionsYouInsidePost(model) {
        this.processOnePostForList(model.data.post); // This also process User
        usersPostProcessor.processModelAuthorForListEntity(model.target_entity.User);
    }
    /**
     *
     * @param {Object} model
     */
    static processUserMentionsYouInsideComment(model) {
        commentsPostProcessor.processManyComments([model.data.comment]);
        usersPostProcessor.processModelAuthorForListEntity(model.data.comment.User);
        this.processOnePostItselfForList(model.data.comment.post);
        usersPostProcessor.processModelAuthorForListEntity(model.target_entity.User);
    }
    /**
     *
     * @param {Object} model
     */
    static processUserCreatesDirectPostForOrg(model) {
        this.processOnePostForList(model.data.post); // This also process User
        orgPostProcessor.processOneOrgModelCard(model.target_entity.organization);
        usersPostProcessor.processModelAuthorForListEntity(model.target_entity.organization.User);
    }
    /**
     *
     * @param {Object} model
     */
    static processUserCreatesCommentForComment(model) {
        commentsPostProcessor.processManyComments([model.data.comment]);
        usersPostProcessor.processModelAuthorForListEntity(model.data.comment.User);
        this.processOnePostItselfForList(model.data.comment.post);
        commentsPostProcessor.processManyComments([model.target_entity.comment]);
        usersPostProcessor.processModelAuthorForListEntity(model.target_entity.comment.User);
        this.processOnePostItselfForList(model.target_entity.comment.post);
    }
    /**
     *
     * @param {Object} model
     */
    static processOneNotificationForResponse(model) {
        if (!model.json_body) {
            const json = JSON.stringify(model, null, 2);
            throw new Error(`Malformed notification. No json_body. Full model is: ${json}`);
        }
        if (model.data || model.target_entity) {
            const json = JSON.stringify(model, null, 2);
            throw new Error(`Malformed notification. Data or target_entity exist but must not: ${json}`);
        }
        model.data = model.json_body.data;
        model.target_entity = model.json_body.target_entity;
        delete model.json_body;
    }
    /**
     *
     * @param {Object[]} posts
     * @param {number} currentUserId
     * @param {Object} userActivity
     * @return {Array}
     */
    static processManyPosts(posts, currentUserId = null, userActivity = null) {
        for (const post of posts) {
            this.processOnePostForList(post, currentUserId, userActivity);
            if (post.post_type_id === ucom_libs_common_1.ContentTypesDictionary.getTypeRepost()) {
                // @ts-ignore #task - should create new object, not processing existing one
                this.processOnePostForList(post.post);
            }
        }
        return posts;
    }
    /**
     *
     * @param {Object} post
     * @param {number} currentUserId
     * @param {Object} userActivity
     * @return {*}
     */
    static processOnePostForList(post, currentUserId = null, userActivity = null) {
        this.normalizeMultiplier(post);
        this.makeNumerical(post);
        usersPostProcessor.processModelAuthorForListEntity(post.User);
        if (currentUserId) {
            // @ts-ignore
            const userPostActivity = userActivity ? userActivity.posts[post.id] : null;
            this.addMyselfDataForPost(post, currentUserId, userPostActivity);
        }
        if (post.organization) {
            orgPostProcessor.processOneOrgModelCard(post.organization);
        }
        PostsPostProcessor.processPostInCommon(post);
        this.normalizeModelInCommon(post);
        // #task - return is not required here
        return post;
    }
    /**
     *
     * @param {Object} post
     */
    static processOnePostItselfForList(post) {
        this.normalizeMultiplier(post);
        postsPostProcessor.processPostInCommon(post);
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
        this.normalizeMultiplier(post);
        this.processManyCommentsOfEntity(post, currentUserId);
        usersPostProcessor.processModelAuthor(post, currentUserId, activityData);
        if (currentUserId) {
            const userPostActivity = currentUserPostActivity ?
                currentUserPostActivity.posts[post.id] : null;
            this.addMyselfDataForPost(post, currentUserId, userPostActivity, orgTeamMembers);
        }
        orgPostProcessor.processOneOrg(post.organization);
        postsPostProcessor.processPostInCommon(post);
        this.processPostTeam(post);
        if (post.post_type_id === ucom_libs_common_1.ContentTypesDictionary.getTypeRepost()) {
            this.processOnePostForList(post.post);
        }
        this.normalizeModelInCommon(post);
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
        users.forEach((user) => {
            usersPostProcessor.processUser(user, currentUserId);
        });
    }
    /**
     *
     * @param {Object[]} comments
     * @param {number} currentUserId
     */
    static processManyComments(comments, currentUserId = null) {
        const processedComments = commentsPostProcessor.processManyComments(comments, currentUserId);
        processedComments.forEach((comment) => {
            this.formatModelDateTime(comment);
            usersPostProcessor.processModelAuthorForListEntity(comment.User);
            if (comment.organization) {
                orgPostProcessor.processOneOrgModelCard(comment.organization);
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
        CommentsPostProcessor.setOneCommentMetadata(comment, 0);
        return processed[0];
    }
    static deleteCommentsFromModel(model) {
        delete model.comments;
    }
    static setEmptyCommentsForOnePost(model, allowRewrite = false) {
        if (!allowRewrite && model.comments) {
            throw new errors_1.AppError('Model already has comments', 500);
        }
        model.comments = this.getEmptyListOfModels();
    }
    static getEmptyListOfModels(page = PAGE_FOR_EMPTY_METADATA, perPage = PER_PAGE_FOR_EMPTY_METADATA) {
        return {
            data: [],
            metadata: this.getEmptyMetadata(page, perPage),
        };
    }
    static getEmptyMetadata(page, perPage) {
        return {
            page,
            per_page: perPage,
            total_amount: 0,
            has_more: false,
        };
    }
    /**
     *
     * @param {Object} model
     * @private
     */
    static normalizeMultiplier(model) {
        if (typeof model.current_rate === 'undefined') {
            return;
        }
        const multiplier = eosImportance.getImportanceMultiplier();
        model.current_rate *= multiplier;
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
        let myselfVote = 'no_vote';
        const join = false; // not supported, suspended
        let organizationMember = false;
        if (model.organization) {
            if (currentUserId === model.organization.user_id) {
                organizationMember = true;
            }
            else {
                organizationMember = orgTeamMembers.includes(currentUserId);
            }
        }
        const repostAvailable = this.getRepostAvailableFlag(model, userPostActivity, currentUserId);
        // eslint-disable-next-line sonarjs/no-collapsible-if
        if (userPostActivity) {
            if (userPostActivity.voting) {
                myselfVote = userPostActivity.voting === ucom_libs_common_1.InteractionTypesDictionary.getUpvoteId() ?
                    'upvote' : 'downvote';
            }
        }
        model.myselfData = {
            myselfVote,
            join,
            organization_member: organizationMember,
            repost_available: repostAvailable,
        };
    }
    /**
     *
     * @param {Object} post
     * @private
     */
    static processPostTeam(post) {
        const teamMembers = [];
        const postUsersTeam = post.post_users_team;
        if (postUsersTeam) {
            postUsersTeam.forEach((teamMember) => {
                usersPostProcessor.processUser(teamMember.User);
                teamMembers.push(teamMember.User);
            });
        }
        post.post_users_team = teamMembers;
    }
    static getRepostAvailableFlag(post, userPostActivity, currentUserId) {
        if (post.post_type_id === ucom_libs_common_1.ContentTypesDictionary.getTypeRepost()) {
            return false;
        }
        if (post.post_type_id === ucom_libs_common_1.ContentTypesDictionary.getTypeDirectPost()
            && post.entity_id_for === currentUserId
            && post.entity_name_for === usersModelProvider.getEntityName()) {
            return false;
        }
        if (post.user_id === currentUserId) {
            return false;
        }
        if (userPostActivity) {
            return !userPostActivity.repost;
        }
        return true;
    }
    static normalizeModelInCommon(model) {
        this.formatModelDateTime(model);
    }
    static makeNumerical(model) {
        const set = [
            'entity_id_for',
        ];
        for (const field of set) {
            if (model[field]) {
                model[field] = +model[field];
            }
        }
    }
    static formatModelDateTime(model) {
        const fields = [
            'created_at',
            'updated_at',
        ];
        for (const field of fields) {
            if (model[field]) {
                model[field] = moment(model[field]).utc().format();
            }
        }
    }
}
module.exports = ApiPostProcessor;
