"use strict";
const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');
class CommentsPostProcessor {
    /**
     *
     * @param {Object[]} comments
     * @param {number} currentUserId
     *
     * @return {Object[]}
     */
    static processManyComments(comments, currentUserId = null) {
        let processedComments;
        processedComments = this.formatPostComments(comments);
        this.sortComments(processedComments);
        this.addMyselfData(processedComments, currentUserId);
        return processedComments;
    }
    static processManyCommentMetadata(comments, collection) {
        for (const comment of comments) {
            comment.metadata = {
                next_depth_total_amount: collection[comment.id] || 0,
            };
        }
    }
    /**
     *
     * @param {Object[]} comments
     * @private
     */
    static formatPostComments(comments) {
        return comments.map((comment) => {
            comment.path = JSON.parse(comment.path);
            return comment;
        });
    }
    /**
     *
     * @param {Object[]} comments
     * @private
     */
    static sortComments(comments) {
        // noinspection FunctionWithInconsistentReturnsJS
        comments.sort((commentA, commentB) => {
            const a = commentA.path;
            const b = commentB.path;
            const iterationAmount = a.length > b.length ? a.length : b.length;
            for (let i = 0; i < iterationAmount; i += 1) {
                if (b[i] === undefined) {
                    return 1;
                }
                if (a[i] === undefined) {
                    return -1;
                }
                if (a[i] !== b[i]) {
                    return a[i] - b[i];
                }
            }
            return;
        });
    }
    /**
     *
     * @param {Object} comments
     * @param {number} currentUserId
     * @private
     */
    static addMyselfData(comments, currentUserId) {
        const activityParameter = 'activity_user_comment';
        if (!currentUserId) {
            return;
        }
        comments.forEach((model) => {
            let myselfVote = 'no_vote';
            if (model.hasOwnProperty(activityParameter) && model[activityParameter].length > 0) {
                for (let i = 0; i < model[activityParameter].length; i += 1) {
                    const current = model[activityParameter][i];
                    if (InteractionTypeDictionary.isUpvoteActivity(current) && current.user_id_from === currentUserId) {
                        myselfVote = 'upvote';
                    }
                    else if (InteractionTypeDictionary.isDownvoteActivity(current) && current.user_id_from === currentUserId) {
                        myselfVote = 'downvote';
                    }
                }
            }
            const myselfData = {
                myselfVote,
            };
            model.myselfData = myselfData;
        });
    }
}
module.exports = CommentsPostProcessor;
