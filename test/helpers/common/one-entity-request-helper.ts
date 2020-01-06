import { UserModel, UsersListResponse } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlRequestHelper } from './graphql-request-helper';

const { GraphQLSchema } = require('ucom-libs-graphql-schemas');

class OneEntityRequestHelper {
  public static async getOneEntityUsersWhoVote(
    entityId: number,
    entityName: string,
    interactionType: number | null = null,
    orderBy: string = '-scaled_importance',
    myself: UserModel | null = null,
  ): Promise<UsersListResponse> {
    const params: any = {
      filters: {
        entity_id:        entityId,
        entity_name:      entityName,
      },
      order_by: orderBy,
      page: 1,
      per_page: 10,
    };

    if (interactionType !== null) {
      params.filters.interaction_type = interactionType;
    }

    const part        = GraphQLSchema.getOneContentVotingUsersQueryPart(params);
    const keyToReturn = 'one_content_voting_users';

    return GraphqlRequestHelper.makeRequestFromOneQueryPartByFetch(part, keyToReturn, myself);
  }
}

export = OneEntityRequestHelper;
