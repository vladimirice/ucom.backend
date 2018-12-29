const requestHelper   = require('../integration/helpers').Req;
const responseHelper  = require('../integration/helpers').Res;

const request = require('supertest');
const server = require('../../app');

class CommentsGenerator {
  static async createCommentForPost(
    postId: number,
    user: any,
    description: string = 'comment description',
  ): Promise<Object> {
    const req = request(server)
      .post(requestHelper.getCommentsUrl(postId))
      .field('description', description)
    ;

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
    const req =  request(server)
      .post(requestHelper.getCommentOnCommentUrl(postId, parentCommentId))
      .field('description', description)
    ;

    requestHelper.addAuthToken(req, user);

    const res = await req;

    responseHelper.expectStatusCreated(res);

    return res.body;
  }
}

export = CommentsGenerator;
