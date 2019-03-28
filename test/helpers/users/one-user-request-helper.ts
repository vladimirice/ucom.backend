import { GraphqlRequestHelper } from '../common/graphql-request-helper';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

const { GraphQLSchema } = require('ucom-libs-graphql-schemas');

class OneUserRequestHelper {
  public static async getOneUserAsMyself(
    myself: UserModel,
    userId: number,
  ): Promise<any> {
    const params = {
      filters: {
        user_id: userId,
      },
    };

    const query = GraphQLSchema.getOneUserQuery(params);
    const key: string = 'one_user';

    return GraphqlRequestHelper.makeRequestAsMyself(myself, query, key, false);
  }

  public static async getOneUserWithTrustedByAsMyself(
    myself: UserModel,
    userId: number,
  ): Promise<any> {
    const oneUserParams = {
      filters: {
        user_id: userId,
      },
    };

    const trustedByParams = {
      filters: {
        user_id: userId,
      },
      order_by: '-id',
      page: 1,
      per_page: 10,
    };

    const parts: string[] = [];

    parts.push(GraphQLSchema.getOneUserQueryPart(oneUserParams));
    parts.push(GraphQLSchema.getOneUserTrustedByQueryPart(trustedByParams));

    return GraphqlRequestHelper.makeRequestFromQueryPartsAsMyself(myself, parts);
  }

  public static async getOneUserTrustedByAsMyself(
    myself: UserModel,
    userId: number,
  ): Promise<any> {
    const params = {
      filters: {
        user_id: userId,
      },
      order_by: '-id',
      page: 1,
      per_page: 10,
    };

    const trustedByPart = GraphQLSchema.getOneUserTrustedByQueryPart(params);

    const query = GraphQLSchema.getQueryMadeFromParts([trustedByPart]);
    const key: string = 'one_user_trusted_by';

    return GraphqlRequestHelper.makeRequestAsMyself(myself, query, key, false);
  }

  public static async getOneUserAsGuest(
    userId: number,
  ): Promise<any> {
    const params = {
      filters: {
        user_id: userId,
      },
    };

    const query = GraphQLSchema.getOneUserQuery(params);
    const key: string = 'one_user';

    return GraphqlRequestHelper.makeRequestAsGuest(query, key, false);
  }
}

export = OneUserRequestHelper;
