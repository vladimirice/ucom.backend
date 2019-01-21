import { UserModel } from '../../lib/users/interfaces/model-interfaces';

const request = require('supertest');

const requestHelper = require('../integration/helpers/request-helper.ts');
const responseHelper = require('../integration/helpers/response-helper.ts');
const server = require('../../app');

class CommentsGenerator {
  static async createManyCommentsForPost(
    postId: number,
    user: UserModel,
    amount: number,
  ): Promise<any> {
    const promises: any = [];

    for (let i = 0; i < amount; i += 1) {
      promises.push(
        this.createCommentForPost(postId, user),
      );
    }

    return Promise.all(promises);
  }

  static async createCommentForPost(
    postId: number,
    user: UserModel,
    description: string = 'comment description',
  ): Promise<Object> {
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
  ): Promise<Object> {
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
