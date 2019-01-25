import { UserModel } from '../../lib/users/interfaces/model-interfaces';
import { CommentModel, CommentModelResponse } from '../../lib/comments/interfaces/model-interfaces';

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
    const promises: any = [];

    for (let i = 0; i < amount; i += 1) {
      promises.push(
        this.createCommentForPost(postId, user),
      );
    }

    // @ts-ignore
    return Promise.all(promises);
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

  static async createCommentForPost(
    postId: number,
    user: UserModel,
    description: string = 'comment description',
  ): Promise<CommentModelResponse> {
    const req = request(server)
      .post(requestHelper.getCommentsUrl(postId))
      .field('description', description);
    requestHelper.addAuthToken(req, user);

    const res = await req;

    responseHelper.expectStatusCreated(res);

    return res.body;
  }

  static async createCommentOnComment(
    postId: number,
    parentCommentId: number,
    user: Object,
    description: string = 'comment description',
  ): Promise<CommentModelResponse> {
    const req = request(server)
      .post(requestHelper.getCommentOnCommentUrl(postId, parentCommentId))
      .field('description', description);
    requestHelper.addAuthToken(req, user);

    const res = await req;

    responseHelper.expectStatusCreated(res);

    return res.body;
  }
}

export = CommentsGenerator;
