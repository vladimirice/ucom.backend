import { GraphqlRequestHelper } from '../common/graphql-request-helper';

const { GraphQLSchema } = require('ucom-libs-graphql-schemas');
const { EntityNames } = require('ucom.libs.common').Common.Dictionary;
const { PostTypes } = require('ucom.libs.common').Posts.Dictionary;

class PostsGraphqlRequest {
  public static async getOrgMainPageTopPublications() {
    const params = {
      filters: {
        post_type_ids: [PostTypes.MEDIA],
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

    return GraphqlRequestHelper.makeRequestFromQueryPartsByFetch([part], key);
  }

  public static async getOrgMainPageFeed() {
    const params = {
      filters: {
        post_type_ids: [PostTypes.MEDIA, PostTypes.DIRECT],
        entity_names_from: [
          EntityNames.ORGANIZATIONS,
          EntityNames.USERS,
        ],
        entity_names_for: [
          EntityNames.ORGANIZATIONS,
        ],
      },
      order_by: '-id',
      page: 1,
      per_page: 10,
    };

    const include = {
      comments: {
        page: 1,
        per_page: 10,
      },
    };

    const part = GraphQLSchema.getPostsFeedQueryPart(params, include);
    const key = 'posts_feed';

    return GraphqlRequestHelper.makeRequestFromQueryPartsByFetch([part], key);
  }

  public static async getUsersMainPageTopPublications() {
    const params = {
      filters: {
        post_type_ids: [PostTypes.MEDIA],
        entity_names_from: [
          EntityNames.USERS,
        ],
        entity_names_for: [
          EntityNames.USERS,
        ],
      },
      order_by: '-current_rate',
      page: 1,
      per_page: 10,
    };

    const part = GraphQLSchema.getPostsFeedQueryPart(params);
    const key = 'posts_feed';

    return GraphqlRequestHelper.makeRequestFromQueryPartsByFetch([part], key);
  }

  public static async getMainPageTopPublicationsForAll() {
    const params = {
      filters: {
        post_type_ids: [PostTypes.MEDIA],
        entity_names_from: [
          EntityNames.USERS,
          EntityNames.ORGANIZATIONS,
        ],
        entity_names_for: [
          EntityNames.USERS,
          EntityNames.ORGANIZATIONS,
        ],
      },
      order_by: '-current_rate',
      page: 1,
      per_page: 10,
    };

    const part = GraphQLSchema.getPostsFeedQueryPart(params);
    const key = 'posts_feed';

    return GraphqlRequestHelper.makeRequestFromQueryPartsByFetch([part], key);
  }

  public static async getUsersMainPageFeed() {
    const params = {
      filters: {
        post_type_ids: [PostTypes.MEDIA, PostTypes.DIRECT],
        entity_names_from: [
          EntityNames.USERS,
        ],
        entity_names_for: [
          EntityNames.USERS,
        ],
      },
      order_by: '-id',
      page: 1,
      per_page: 10,
    };

    const include = {
      comments: {
        page: 1,
        per_page: 10,
      },
    };

    const part = GraphQLSchema.getPostsFeedQueryPart(params, include);
    const key = 'posts_feed';

    return GraphqlRequestHelper.makeRequestFromQueryPartsByFetch([part], key);
  }
}

export = PostsGraphqlRequest;
