const ActivityDictionary = require('../activity/activity-types-dictionary');


class ProcessorApiResponse {
  /**
   *
   * @param {Object} model
   * @param {number} currentUserId
   */
  static processPostComments(model, currentUserId) {
    if (!model['comments']) {
      return;
    }

    const comments = model['comments'];

    this._formatPostComments(model);
    this._sortPostComments(model);

    this._addMyselfData(comments, currentUserId);

  }

  /**
   *
   * @param {Object} comments
   * @param currentUserId
   * @private
   */
  static _addMyselfData(comments, currentUserId) {

    if (!currentUserId) {
      return;
    }

    const activityParameter = 'activity_user_comment';

    comments.forEach(model => {

      let myselfVote = 'no_vote';

      if (model.hasOwnProperty(activityParameter) && model[activityParameter].length > 0) {
        for (let i = 0; i < model[activityParameter].length; i++) {
          const current = model[activityParameter][i];

          if (ActivityDictionary.isUpvoteActivity(current) && current.user_id_from === currentUserId) {
            myselfVote = 'upvote';
          }
        }
      }

      model.myselfData = {
        myselfVote,
      };
    });
  }

  /**
   *
   * @param {Object} post
   * @private
   */
  static _formatPostComments(post) {
    post.comments = post.comments.map(comment => {
      comment.path = JSON.parse(comment.path);
      return comment;
    });
  }

  /**
   *
   * @param model
   * @private
   */
  static _sortPostComments(model) {
    model['comments'].sort((commentA, commentB) => {

      const a = commentA.path;
      const b = commentB.path;

      const iterationAmount = a.length > b.length ? a.length : b.length;

      for (let i = 0; i < iterationAmount; i++) {
        if (b[i] === undefined) return 1;
        if (a[i] === undefined) return -1;

        if (a[i] !== b[i]) return a[i] - b[i];
      }
    });
  }
}

module.exports = ProcessorApiResponse;