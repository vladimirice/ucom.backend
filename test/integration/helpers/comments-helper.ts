/* eslint-disable max-len */
/* tslint:disable:max-line-length */
import { CommentModelResponse } from '../../../lib/comments/interfaces/model-interfaces';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { FAKE_SIGNED_TRANSACTION } from '../../generators/common/fake-data-generator';
import { StringToAnyCollection } from '../../../lib/common/interfaces/common-types';

import CommentsModelProvider = require('../../../lib/comments/service/comments-model-provider');
import ResponseHelper = require('./response-helper');
import RequestHelper = require('./request-helper');
import CommonChecker = require('../../helpers/common/common-checker');

const request = require('supertest');
const _ = require('lodash');

const server = RequestHelper.getApiApplication();

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

    res.body.data = res.body.data.filter(Boolean);

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

  public static async requestToUpvoteComment(
    postId: number,
    commentId: number,
    myself: UserModel,
    signedTransaction: any = null,
  ) {
    return this.requestToVoteComment('upvote', postId, commentId, myself, signedTransaction);
  }

  private static async requestToVoteComment(
    voteString: string,
    postId: number,
    commentId: number,
    myself: UserModel,
    signedTransaction: any,
  ) {
    const url = `/api/v1/posts/${postId}/comments/${commentId}/${voteString}`;
    const req = RequestHelper.getRequestObjForPostWithMyself(url, myself);

    if (signedTransaction) {
      RequestHelper.addSignedTransactionToRequest(req, signedTransaction);
    } else {
      RequestHelper.addFakeSignedTransactionString(req);
    }

    const res = await req;

    ResponseHelper.expectStatusCreated(res);

    return res.body;
  }

  public static async updateCommentWithFields(
    commentId: number,
    myself: UserModel,
    givenFields: any = {},
    expectedStatus: number = 200,
    addFakeSignedTransaction: boolean = true,
  ): Promise<CommentModelResponse> {
    const url: string = RequestHelper.getCommentsUpdateUrl(commentId);

    const defaultFields: StringToAnyCollection = {
      description:        'New comment description',
      entity_images:      '{}',
    };

    if (addFakeSignedTransaction) {
      defaultFields.signed_transaction = FAKE_SIGNED_TRANSACTION;
    }

    const fields = {
      ...defaultFields,
      ...givenFields,
    };

    const response = await RequestHelper.makePatchRequestAsMyselfWithFields(url, myself, fields, expectedStatus);

    return response.body;
  }


  public static async requestToDownvoteComment(
    postId: number,
    commentId: number,
    myself: UserModel,
    signedTransaction: any = null,
  ) {
    return this.requestToVoteComment('downvote', postId, commentId, myself, signedTransaction);
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

    if (options && (options.myselfData || (options.comments && options.comments.myselfData))) {
      fieldsFromRelations.push('myselfData');
    }

    this.checkOneCommentMetadataStructure(model);

    CommonChecker.expectAllFieldsExistence(
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

    CommonChecker.expectAllFieldsExistence(
      model,
      Array.prototype.concat(expected, fieldsFromRelations),
    );
  }
}

export = CommentsHelper;
