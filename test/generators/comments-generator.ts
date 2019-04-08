import { UserModel } from '../../lib/users/interfaces/model-interfaces';
import { CommentModel, CommentModelResponse } from '../../lib/comments/interfaces/model-interfaces';
import RequestHelper = require('../integration/helpers/request-helper');

const request = require('supertest');

const requestHelper = require('../integration/helpers/request-helper.ts');
const responseHelper = require('../integration/helpers/response-helper.ts');
const server = require('../../app');

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

  public static async createCommentForPost(
    postId: number,
    user: UserModel,
    description: string  = 'comment description',
    entityImages: any = null,
    expectedStatus: number = 201,
  ): Promise<CommentModelResponse> {
    const req = request(server)
      .post(requestHelper.getCommentsUrl(postId))
      .field('description', description);

    if (entityImages !== null) {
      RequestHelper.addEntityImagesField(req, entityImages);
    }

    requestHelper.addAuthToken(req, user);

    const res = await req;

    responseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
  }

  public static async createCommentForPostAndGetId(
    postId: number,
    user: UserModel,
    description: string = 'comment description',
  ): Promise<number> {
    const body: CommentModelResponse = await this.createCommentForPost(postId, user, description);

    return body.id;
  }

  public static async createCommentOnComment(
    postId: number,
    parentCommentId: number,
    user: UserModel,
    description: string = 'comment description',
    entityImages: any = null,
    expectedStatus: number = 201,
  ): Promise<CommentModelResponse> {
    const req = request(server)
      .post(requestHelper.getCommentOnCommentUrl(postId, parentCommentId))
      .field('description', description);
    requestHelper.addAuthToken(req, user);

    if (entityImages !== null) {
      RequestHelper.addEntityImagesField(req, entityImages);
    }

    const res = await req;

    responseHelper.expectStatusToBe(res, expectedStatus);

    return res.body;
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
