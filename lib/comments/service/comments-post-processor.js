const { InteractionTypeDictionary } = require('uos-app-transaction');

class CommentsPostProcessor {

  /**
   *
   * @param {Object[]} comments
   * @param {number} currentUserId
   *
   * @return {Object[]}
   */
  static processManyComments(comments, currentUserId) {
    let processedComments;

    processedComments = this._formatPostComments(comments);
    this._sortComments(processedComments);

    this._addMyselfData(processedComments, currentUserId);

    return processedComments;
  }

  /**
   *
   * @param {Object[]} comments
   * @private
   */
  static _formatPostComments(comments) {
    return comments.map(comment => {
      comment.path = JSON.parse(comment.path);
      return comment;
    });
  }

  /**
   *
   * @param {Object[]} comments
   * @private
   */
  static _sortComments(comments) {
    // noinspection FunctionWithInconsistentReturnsJS
    comments.sort((commentA, commentB) => {

      const a = commentA.path;
      const b = commentB.path;

      const iterationAmount = a.length > b.length ? a.length : b.length;

      for (let i = 0; i < iterationAmount; i++) {
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
    });
  }

  /**
   *
   * @param {Object} comments
   * @param {number} currentUserId
   * @private
   */
  static _addMyselfData(comments, currentUserId) {
    const activityParameter = 'activity_user_comment';

    if (!currentUserId) {
      return;
    }

    comments.forEach(model => {

      let myselfVote = 'no_vote';

      if (model.hasOwnProperty(activityParameter) && model[activityParameter].length > 0) {
        for (let i = 0; i < model[activityParameter].length; i++) {
          const current = model[activityParameter][i];

          if (InteractionTypeDictionary.isUpvoteActivity(current) && current.user_id_from === currentUserId) {
            myselfVote = 'upvote';
          } else if(InteractionTypeDictionary.isDownvoteActivity(current) && current.user_id_from === currentUserId) {
            myselfVote = 'downvote';
          }
        }
      }

      model.myselfData = {
        myselfVote,
      };
    });
  }
}

module.exports = CommentsPostProcessor;