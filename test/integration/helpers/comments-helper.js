const request = require('supertest');
const server = require('../../../app');
const _ = require('lodash');

const RequestHelper = require('./request-helper');
const ResponseHelper = require('./response-helper');
const models = require('../../../models');

const CommentsRepositories = require('../../../lib/comments/repository');
const CommentsRepository = CommentsRepositories.Main;

class CommentsHelper {

  static getCommentsRepository() {
    return CommentsRepository;
  }

  /**
   *
   * @param {Object} myself
   * @param {number} postId
   * @param {boolean} dataOnly
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   */
  static async requestToGetManyCommentsAsMyself(myself, postId, dataOnly = true, expectedStatus = 200) {
    const res = await request(server)
      .get(`/api/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${myself.token}`)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    if (expectedStatus === 200) {
      expect(Array.isArray(res.body.data)).toBeTruthy();
    }

    res.body.data = _.filter(res.body.data);

    if (dataOnly) {
      return res.body.data;
    }

    return res.body;
  }
  /**
   *
   * @param {number} postId
   * @param {boolean} dataOnly
   * @param {number} expectedStatus
   * @return {Promise<Object>}
   */
  static async requestToGetManyCommentsAsGuest(postId, dataOnly = true, expectedStatus = 200) {
    const res = await request(server)
      .get(`/api/v1/posts/${postId}/comments`)
    ;

    ResponseHelper.expectStatusToBe(res, expectedStatus);

    if (expectedStatus === 200) {
      expect(Array.isArray(res.body.data)).toBeTruthy();
    }

    res.body.data = _.filter(res.body.data);

    if (dataOnly) {
      return res.body.data;
    }

    return res.body;
  }

  /**
   *
   * @param {number} post_id
   * @param {number} comment_id
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async requestToUpvoteComment(post_id, comment_id, user) {
    const res = await request(server)
      .post(`/api/v1/posts/${post_id}/comments/${comment_id}/upvote`)
      .set('Authorization', `Bearer ${user.token}`)
    ;

    ResponseHelper.expectStatusCreated(res);

    return res.body;
  }

  /**
   *
   * @param {number} post_id
   * @param {number} comment_id
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async requestToDownvoteComment(post_id, comment_id, user) {
    const res = await request(server)
      .post(`/api/v1/posts/${post_id}/comments/${comment_id}/downvote`)
      .set('Authorization', `Bearer ${user.token}`)
    ;

    ResponseHelper.expectStatusCreated(res);

    return res.body;
  }

  /**
   *
   * @param {Object} actual
   */
  static checkCommentResponseBody(actual) {
    models['comments'].apiResponseFields().forEach(field => {
      expect(actual[field]).toBeDefined();
    });
  }

  /**
   * @deprecated
   * @see CommentsGenerator
   * @param {number} postId
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async requestToCreateComment(postId, user) {
    const res = await request(server)
      .post(RequestHelper.getCommentsUrl(postId))
      .set('Authorization', `Bearer ${user.token}`)
      .field('description', 'comment description')
    ;

    ResponseHelper.expectStatusCreated(res);

    return res.body;
  }

  /**
   * @deprecated
   * @see CommentsGenerator#createCommentOnComment
   *
   * @param {number} postId
   * @param {number} parentCommentId
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async requestToCreateCommentOnComment(postId, parentCommentId, user) {
    const res = await request(server)
      .post(RequestHelper.getCommentOnCommentUrl(postId, parentCommentId))
      .set('Authorization', `Bearer ${user.token}`)
      .field('description', 'comment description')
    ;

    ResponseHelper.expectStatusCreated(res);

    return res.body;
  }

  /**
   *
   * @param {Object} model - model with included user
   * @param {Object} options
   */
  static checkOneCommentPreviewFields(model, options = {}) {
    expect(model).toBeDefined();
    expect(model).not.toBeNull();

    expect(Array.isArray(model.path), 'Probably you did not post-process comment').toBeTruthy();

    const expected = CommentsRepository.getModel().getFieldsForPreview();

    let fieldsFromRelations = [];
    if (options.postProcessing === 'notification') {
      fieldsFromRelations = [
        'User',
        'post'
      ];
    } else if (options.postProcessing === 'notificationWithOrg') {
      fieldsFromRelations = [
        'User',
        'post',
        'organization',
      ];
    } else {
      fieldsFromRelations = [
        'User',
        'activity_user_comment',
        'organization',
      ];
    }


    if (options && options.myselfData) {
      fieldsFromRelations.push('myselfData');
    }

    ResponseHelper.expectAllFieldsExistence(model, _.concat(expected, fieldsFromRelations));
  }
}

module.exports = CommentsHelper;