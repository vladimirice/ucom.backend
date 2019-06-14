import { GraphqlRequestHelper } from '../common/graphql-request-helper';
import { UserModel, UsersListResponse } from '../../../lib/users/interfaces/model-interfaces';

const { GraphQLSchema } = require('ucom-libs-graphql-schemas');

class ManyUsersRequestHelper {
  public static async getManyTrendingUsersAsGuest(
  ): Promise<UsersListResponse> {
    return this.getManyTrendingUsers();
  }

  public static async getManyTrendingUsersAsMyself(
    myself: UserModel,
  ): Promise<UsersListResponse> {
    return this.getManyTrendingUsers(myself);
  }

  public static async getManyTrendingUsers(
    myself: UserModel | null = null,
    orderBy: string = '-scaled_social_rate_delta',
    page: number = 1,
    perPage: number = 10,
  ): Promise<UsersListResponse> {
    const params = {
      filters: {
        overview_type: 'trending',
      },
      order_by: orderBy,
      page,
      per_page: perPage,
    };

    const isMyself = myself !== null;

    const part: string = GraphQLSchema.getManyUsersQueryPart(params, isMyself);
    const keyToReturn = 'many_users';

    return GraphqlRequestHelper.makeRequestFromOneQueryPartByFetch(part, keyToReturn, myself);
  }
}

export = ManyUsersRequestHelper;
