"use strict";
const CommentsPostProcessor = require("../../comments/service/comments-post-processor");
const errors_1 = require("../../api/errors");
const PAGE_FOR_EMPTY_METADATA = 1;
const PER_PAGE_FOR_EMPTY_METADATA = 10;
const moment = require('moment');
const { InteractionTypeDictionary, ContentTypeDictionary } = require('ucom-libs-social-transactions');
const commentsPostProcessor = require('../../comments/service/comments-post-processor');
const usersPostProcessor = require('../../users/user-post-processor');
const orgPostProcessor = require('../../organizations/service/organization-post-processor');
const postsPostProcessor = require('../../posts/service/posts-post-processor');
const usersModelProvider = require('../../users/users-model-provider');
const eosImportance = require('../../eos/eos-importance');
class ApiPostProcessor {
    static processOneTag(model) {
        this.normalizeMultiplier(model);
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
        orgPostProcessor.processOneOrgWithoutActivity(model.data.organization);
        usersPostProcessor.processModelAuthorForListEntity(model.data.User);
        usersPostProcessor.processModelAuthorForListEntity(model.target_entity.User);
    }
    /**
     *
     * @param {Object} model
     */
    static processOneUserFollowsOrgNotification(model) {
        usersPostProcessor.processModelAuthorForListEntity(model.data.User);
        orgPostProcessor.processOneOrgWithoutActivity(model.target_entity.organization);
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
    static processUserVotesPostOfOtherUser(model) {
        usersPostProcessor.processModelAuthorForListEntity(model.data.User);
        this.processOnePostItselfForList(model.target_entity.post);
        usersPostProcessor.processModelAuthorForListEntity(model.target_entity.post.User);
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
        orgPostProcessor.processOneOrgWithoutActivity(model.target_entity.comment.organization);
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
        orgPostProcessor.processOneOrgWithoutActivity(model.target_entity.post.organization);
    }
    /**
     *
     * @param {Object} model
     */
    static processUserVotesPostOfOrg(model) {
        usersPostProcessor.processModelAuthorForListEntity(model.data.User);
        this.processOnePostItselfForList(model.target_entity.post);
        usersPostProcessor.processModelAuthorForListEntity(model.target_entity.post.User);
        orgPostProcessor.processOneOrgWithoutActivity(model.target_entity.post.organization);
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
        orgPostProcessor.processOneOrgWithoutActivity(model.target_entity.post.organization);
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
        orgPostProcessor.processOneOrgWithoutActivity(model.target_entity.comment.organization);
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
        orgPostProcessor.processOneOrgWithoutActivity(model.target_entity.organization);
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
    static processManyPosts(posts, currentUserId, userActivity) {
        for (let i = 0; i < posts.length; i += 1) {
            const post = posts[i];
            this.processOnePostForList(post, currentUserId, userActivity);
            if (post.post_type_id === ContentTypeDictionary.getTypeRepost()) {
                this.processOnePostForList(post.post);
            }
            this.formatModelDateTime(post);
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
            orgPostProcessor.processOneOrgWithoutActivity(post.organization);
        }
        postsPostProcessor.processPostInCommon(post);
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
        if (post.post_type_id === ContentTypeDictionary.getTypeRepost()) {
            this.processOnePostForList(post.post);
        }
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
                orgPostProcessor.processOneOrgWithoutActivity(comment.organization);
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
    static getEmptyListOfModels() {
        return {
            data: [],
            metadata: this.getEmptyMetadata(),
        };
    }
    static getEmptyMetadata() {
        return {
            page: PAGE_FOR_EMPTY_METADATA,
            per_page: PER_PAGE_FOR_EMPTY_METADATA,
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
                organizationMember = orgTeamMembers.indexOf(currentUserId) !== -1;
            }
        }
        const repostAvailable = this.getRepostAvailableFlag(model, userPostActivity, currentUserId);
        if (userPostActivity) {
            if (userPostActivity.voting) {
                myselfVote = userPostActivity.voting === InteractionTypeDictionary.getUpvoteId() ?
                    'upvote' : 'downvote';
            }
        }
        const myselfData = {
            myselfVote,
            join,
            organization_member: organizationMember,
            repost_available: repostAvailable,
        };
        model.myselfData = myselfData;
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
        if (post.post_type_id === ContentTypeDictionary.getTypeRepost()) {
            return false;
        }
        if (post.post_type_id === ContentTypeDictionary.getTypeDirectPost()
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
            if (!model[field]) {
                continue;
            }
            model[field] = moment(model[field]).utc().format();
        }
    }
}
module.exports = ApiPostProcessor;
