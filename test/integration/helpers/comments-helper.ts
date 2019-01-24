/* eslint-disable max-len */
/* tslint:disable:max-line-length */
import { CommentModelResponse } from '../../../lib/comments/interfaces/model-interfaces';

import CommentsModelProvider = require('../../../lib/comments/service/comments-model-provider');
import ResponseHelper = require('./response-helper');
import RequestHelper = require('./request-helper');

const request = require('supertest');
const _ = require('lodash');
const server = require('../../../app');

const models = require('../../../models');

const commentsRepositories = require('../../../lib/comments/repository');

const commentsRepository = commentsRepositories.Main;

class CommentsHelper {
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

    res.body.data = Array.prototype.filter(res.body.data);

    if (dataOnly) {
      return res.body.data;
    }

    return res.body;
  }

  // noinspection JSUnusedGlobalSymbols
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

    res.body.data = Array.prototype.filter(res.body.data);

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

    ResponseHelper.expectStatusCreated(res);

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

    ResponseHelper.expectStatusCreated(res);

    return res.body;
  }

  /**
   *
   * @param {Object} actual
   */
  static checkCommentResponseBody(actual) {
    models.comments.apiResponseFields().forEach((field) => {
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
   * @see generator
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

  public static checkOneCommentItself(model: CommentModelResponse, options: any) {
    expect(_.isEmpty(model)).toBeFalsy();

    // @ts-ignore
    expect(Array.isArray(model.path), 'Probably you did not post-process comment').toBeTruthy();

    const expected = CommentsModelProvider.getCommentsFieldsForPreview();
    const fieldsFromRelations: string[] = [
      'User',
      'activity_user_comment',
      'organization',
      'metadata',
    ];

    if (options && options.myselfData) {
      fieldsFromRelations.push('myselfData');
    }

    this.checkOneCommentMetadataStructure(model);

    ResponseHelper.expectAllFieldsExistence(
      model,
      Array.prototype.concat(expected, fieldsFromRelations),
    );
  }

  private static checkOneCommentMetadataStructure(model: CommentModelResponse): void {
    expect(model.metadata).toBeDefined();
    expect(typeof model.metadata.next_depth_total_amount).toBe('number');
    expect(model.metadata.next_depth_total_amount).toBeGreaterThanOrEqual(0);
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

    if (options && options.myselfData) {
      fieldsFromRelations.push('myselfData');
    }

    if (options && options.postProcessing !== 'notification'
    && options.postProcessing !== 'notificationWithOrg' && !options.commentsV1) {
      fieldsFromRelations.push('metadata');

      expect(model.metadata).toBeDefined();
      expect(typeof model.metadata.next_depth_total_amount).toBe('number');
      expect(model.metadata.next_depth_total_amount).toBeGreaterThanOrEqual(0);
    }

    ResponseHelper.expectAllFieldsExistence(
      model,
      Array.prototype.concat(expected, fieldsFromRelations),
    );
  }
}

export = CommentsHelper;
