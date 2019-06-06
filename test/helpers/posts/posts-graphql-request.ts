import { GraphqlRequestHelper } from '../common/graphql-request-helper';

const { GraphQLSchema } = require('ucom-libs-graphql-schemas');
const { EntityNames } = require('ucom.libs.common').Common.Dictionary;

class PostsGraphqlRequest {
  public static async getPostsFeed() {
    const params = {
      filters: {
        post_type_id: 1,
        entity_names_from: [
          EntityNames.ORGANIZATIONS,
        ],
        entity_names_for: [
          EntityNames.ORGANIZATIONS,
        ],
      },
      order_by: '-current_rate',
      page: 1,
      per_page: 10,
    };

    const part = GraphQLSchema.getPostsFeedQueryPart(params);
    const key = 'posts_feed';

    return GraphqlRequestHelper.makeRequestFromQueryPartsAsGuestByFetch([part], key);
  }
}

export = PostsGraphqlRequest;
