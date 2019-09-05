import { UserModel } from '../../lib/users/interfaces/model-interfaces';
import { CommentModel, CommentModelResponse } from '../../lib/comments/interfaces/model-interfaces';
import { StringToAnyCollection } from '../../lib/common/interfaces/common-types';

import RequestHelper = require('../integration/helpers/request-helper');

const request = require('supertest');

const requestHelper = require('../integration/helpers/request-helper.ts');
const responseHelper = require('../integration/helpers/response-helper.ts');

const server = RequestHelper.getApiApplication();

class CommentsGenerator {
  static async createManyCommentsForPost(
    postId: number,
    user: UserModel,
    amount: number,
  ): Promise<CommentModelResponse[]> {
    const res: any[] = [];

    for (let i = 0; i < amount; i += 1) {
      const data = await this.createCommentForPost(postId, user);
      res.push(data);
    }

    return res;
  }

  static async createManyCommentsForManyComments(
    postId: number,
    comments: CommentModel[],
    user: UserModel,
    amount: number,
  ): Promise<CommentModel[]> {
    const res: CommentModel[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const comment of comments) {
      for (let i = 0; i < amount; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const data = await this.createCommentOnComment(postId, +comment.id, user);
        res.push(data);
      }
    }

    // @ts-ignore
    return res;
  }


  /**
   * @deprecated
   * @see createCommentForPostWithField
   */
  public static async createCommentForPost(
    postId: number,
    user: UserModel,
    description: string  = 'comment description',
    entityImages: any = undefined,
    expectedStatus: number = 201,
  ): Promise<CommentModelResponse> {
    const req = request(server)
      .post(requestHelper.getCommentsUrl(postId))
      .field('description', description);

    RequestHelper.addFakeBlockchainIdAndSignedTransaction(req);

    if (typeof entityImages !== 'undefined') {
      RequestHelper.addEntityImagesField(req, entityImages);
    } else {
      RequestHelper.addEntityImagesField(req, {});
    }

    requestHelper.addAuthToken(req, user);

    const res = await req;

    responseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  public static async createCommentForPostWithField(
    postId: number,
    myself: UserModel,
    givenFields: any = {},
    expectedStatus: number = 201,
  ): Promise<CommentModelResponse> {
    const url: string = requestHelper.getCommentsUrl(postId);

    const fields = {
      description: 'New comment description',
      entity_images: '{}',
      signed_transaction: 'signed_transaction',
      blockchain_id: 'blockchain_id',
      ...givenFields,
    };

    const response = await RequestHelper.makePostRequestAsMyselfWithFields(url, myself, fields, expectedStatus);

    return response.body;
  }

  public static async createCommentForPostAndGetId(
    postId: number,
    user: UserModel,
    description: string = 'comment description',
  ): Promise<number> {
    const body: CommentModelResponse = await this.createCommentForPost(postId, user, description);

    return body.id;
  }

  /**
   * @deprecated
   * @see createCommentOnCommentWithFields
   */
  public static async createCommentOnComment(
    postId: number,
    parentCommentId: number,
    user: UserModel,
    description: string = 'comment description',
    entityImages: any = null,
    expectedStatus: number = 201,
  ): Promise<CommentModelResponse> {
    const req = request(server)
      .post(RequestHelper.getCommentOnCommentUrl(postId, parentCommentId))
      .field('description', description);
    RequestHelper.addAuthToken(req, user);

    RequestHelper.addFakeBlockchainIdAndSignedTransaction(req);

    if (entityImages !== null) {
      RequestHelper.addEntityImagesField(req, entityImages);
    } else {
      RequestHelper.addEntityImagesField(req, {});
    }

    const res = await req;

    responseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  public static async createCommentOnCommentWithFields(
    postId: number,
    parentCommentId: number,
    myself: UserModel,
    givenFields: StringToAnyCollection = {},
    expectedStatus: number = 201,
  ): Promise<CommentModelResponse> {
    const url = requestHelper.getCommentOnCommentUrl(postId, parentCommentId);

    const fields = {
      description: 'New comment on comment description',
      entity_images: '{}',
      signed_transaction: 'signed_transaction',
      blockchain_id: 'blockchain_id',
      ...givenFields,
    };

    const response = await RequestHelper.makePostRequestAsMyselfWithFields(url, myself, fields, expectedStatus);

    return response.body;
  }

  public static async createCommentOnCommentAndGetId(
    postId: number,
    parentCommentId: number,
    user: UserModel,
    description: string = 'comment description',
  ): Promise<number> {
    const body = await this.createCommentOnComment(postId, parentCommentId, user, description);

    return +body.id;
  }
}

export = CommentsGenerator;
