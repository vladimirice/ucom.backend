import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlRequestHelper } from '../common/graphql-request-helper';

import ResponseHelper = require('../../integration/helpers/response-helper');

const { GraphQLSchema } = require('ucom-libs-graphql-schemas');

class ManyOrganizationsRequest {
  public static async getOneUserFollowsOrganizationsAsMyself(
    myself: UserModel,
    userId: number,
    orderBy: string = '-title',
    page: number = 1,
    perPage: number = 10,
  ): Promise<any> {
    const params = {
      filters: {
        user_id: userId,
      },
      order_by: orderBy,
      page,
      per_page: perPage,
    };

    const part = GraphQLSchema.getOneUserFollowsOrganizationsQueryPart(params);

    const query = GraphQLSchema.getQueryMadeFromParts([part]);
    const key: string = 'one_user_follows_organizations';

    const response = await GraphqlRequestHelper.makeRequestAsMyself(myself, query, key, false);

    ResponseHelper.checkListResponseStructure(response);

    return response;
  }
}

export = ManyOrganizationsRequest;
