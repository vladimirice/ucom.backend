/* tslint:disable:max-line-length */
const request = require('supertest');
const server = require('../../../app');
const _ = require('lodash');

const requestHelper = require('./request-helper');
const responseHelper = require('./response-helper');
const models = require('../../../models');

const commentsRepositories = require('../../../lib/comments/repository');
const commentsRepository = commentsRepositories.Main;

class CommentsHelper {

  static getCommentsRepository() {
    return commentsRepository;
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

    responseHelper.expectStatusToBe(res, expectedStatus);

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

    responseHelper.expectStatusToBe(res, expectedStatus);

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
   * @param {number} commentId
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async requestToUpvoteComment(postId, commentId, user) {
    const res = await request(server)
      .post(`/api/v1/posts/${postId}/comments/${commentId}/upvote`)
      .set('Authorization', `Bearer ${user.token}`)
    ;

    responseHelper.expectStatusCreated(res);

    return res.body;
  }

  /**
   *
   * @param {number} postId
   * @param {number} commentId
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async requestToDownvoteComment(postId, commentId, user) {
    const res = await request(server)
      .post(`/api/v1/posts/${postId}/comments/${commentId}/downvote`)
      .set('Authorization', `Bearer ${user.token}`)
    ;

    responseHelper.expectStatusCreated(res);

    return res.body;
  }

  /**
   *
   * @param {Object} actual
   */
  static checkCommentResponseBody(actual) {
    models['comments'].apiResponseFields().forEach((field) => {
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
      .post(requestHelper.getCommentsUrl(postId))
      .set('Authorization', `Bearer ${user.token}`)
      .field('description', 'comment description')
    ;

    responseHelper.expectStatusCreated(res);

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
      .post(requestHelper.getCommentOnCommentUrl(postId, parentCommentId))
      .set('Authorization', `Bearer ${user.token}`)
      .field('description', 'comment description')
    ;

    responseHelper.expectStatusCreated(res);

    return res.body;
  }

  /**
   *
   * @param {Object} model - model with included user
   * @param {Object} options
   */
  static checkOneCommentPreviewFields(model, options: any = {}) {
    expect(model).toBeDefined();
    expect(model).not.toBeNull();

    // @ts-ignore
    expect(Array.isArray(model.path), 'Probably you did not post-process comment').toBeTruthy();

    const expected = commentsRepository.getModel().getFieldsForPreview();

    let fieldsFromRelations: any = [];
    if (options.postProcessing === 'notification') {
      fieldsFromRelations = [
        'User',
        'post',
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

    if (options && options.commentItselfMetadata) {
      fieldsFromRelations.push('metadata');
    }

    if (options && options.myselfData) {
      fieldsFromRelations.push('myselfData');
    }

    responseHelper.expectAllFieldsExistence(model, _.concat(expected, fieldsFromRelations));
  }
}

export = CommentsHelper;
