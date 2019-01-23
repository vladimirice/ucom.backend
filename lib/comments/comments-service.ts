/* tslint:disable:max-line-length */

import { RequestQueryComments } from '../api/filters/interfaces/query-filter-interfaces';

const commentsRepository = require('./comments-repository');

const commentsActivityService = require('./comments-activity-service');

const apiPostProcessor = require('../common/service/api-post-processor');

const commentsFetchService = require('./service/comments-fetch-service');

class CommentsService {
  private currentUser;

  constructor(currentUser) {
    this.currentUser = currentUser;
  }

  /**
   *
   * @param {number} postId
   * @return {Promise<Array>}
   */
  async findAndProcessCommentsByPostId(postId: number) {
    const userId = this.currentUser.id;

    const query: RequestQueryComments = {
      page: 1,
      per_page: 100, // #hardcode
    };

    return commentsFetchService.findAndProcessCommentsByPostId(postId, userId, query);
  }

  /**
   *
   * @param {number} commentIdTo
   * @param {Object} body
   * @returns {Promise<{current_vote: number}>}
   */
  async upvoteComment(commentIdTo, body) {
    const userFrom = this.currentUser.user;

    return commentsActivityService.userUpvotesComment(userFrom, commentIdTo, body);
  }

  /**
   *
   * @param {number} commentIdTo
   * @param {Object} body
   * @returns {Promise<{current_vote: number}>}
   */
  async downvoteComment(commentIdTo, body) {
    const userFrom = this.currentUser.user;

    return commentsActivityService.userDownvotesComment(userFrom, commentIdTo, body);
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async findAndProcessOneComment(id) {
    const comment = await commentsRepository.findOneById(id);

    return apiPostProcessor.processOneComment(comment, this.currentUser.id);
  }
}

export = CommentsService;
