import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import RequestHelper = require('../../integration/helpers/request-helper');

class PostsRestRequest {
  public static async updateMediaPostWithGivenFields(
    postId: number,
    myself: UserModel,
    fields: any,
  ): Promise<number> {
    const url: string = RequestHelper.getOnePostV2Url(postId);

    const response =
      await RequestHelper.makePatchRequestAsMyselfWithFields(url, myself, fields);

    return +response.body.post_id;
  }
}

export = PostsRestRequest;
