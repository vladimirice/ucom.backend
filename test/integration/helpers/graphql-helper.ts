import { InMemoryCache } from 'apollo-cache-inmemory';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { PostModelMyselfResponse, PostModelResponse } from '../../../lib/posts/interfaces/model-interfaces';
import { CommentsListResponse } from '../../../lib/comments/interfaces/model-interfaces';

const ApolloClient = require('apollo-boost').default;
const { gql } = require('apollo-boost');

const { GraphQLSchema } = require('ucom-libs-graphql-schemas');

const { app, server } = require('../../../graphql-app');

const PORT = 4007;

const GRAPHQL_URI = `http://127.0.0.1:${PORT}${server.graphqlPath}`;

let serverApp;
let client;

require('cross-fetch/polyfill');


export class GraphqlHelper {
  public static async getOnePostAsMyself(
    myself: UserModel,
    postId: number,
  ): Promise<PostModelMyselfResponse> {
    const query: string = GraphQLSchema.getOnePostQueryAsMyself(postId);
    const key: string = 'one_post';

    return this.makeRequestAsMyself(myself, query, key, false);
  }

  public static async getUserWallFeedQueryAsMyself(
    myself: UserModel,
    userId: number,
    page: number = 1,
    perPage: number = 10,
    commentsPage: number = 1,
    commentsPerPage: number = 10,
  ): Promise<PostModelMyselfResponse> {
    const query: string = GraphQLSchema.getUserWallFeedQuery(
      userId,
      page,
      perPage,
      commentsPage,
      commentsPerPage,
    );

    const key: string = 'user_wall_feed';

    return this.makeRequestAsMyself(myself, query, key, false);
  }

  public static async getPostCommentsAsMyself(
    myself: UserModel,
    commentableId: number,
    page: number,
    perPage: number,
  ): Promise<CommentsListResponse> {
    const query: string = GraphQLSchema.getPostCommentsQuery(commentableId, page, perPage);
    const key: string = 'feed_comments';

    return this.makeRequestAsMyself(myself, query, key, false);
  }

  public static async getCommentsOnCommentAsMyself(
    myself: UserModel,
    postId: number,
    parentId: number,
    parentDepth: number,
    page: number,
    perPage: number,
  ): Promise<any> {
    // check depth for one commentZeroDepth
    const query = GraphQLSchema.getCommentsOnCommentQuery(
      postId,
      parentId,
      parentDepth,
      page,
      perPage,
    );

    const key: string = 'comments_on_comment';

    return this.makeRequestAsMyself(myself, query, key, false);
  }

  public static async getUserNewsFeed(
    myself: UserModel,
  ): Promise<PostModelMyselfResponse> {
    const query: string = GraphQLSchema.getUserNewsFeed(1, 10, 1, 10);
    const key: string = 'user_news_feed';

    return this.makeRequestAsMyself(myself, query, key, false);
  }

  public static async getOnePostAsGuest(postId: number): Promise<PostModelResponse> {
    const query: string = GraphQLSchema.getOnePostQueryAsGuest(postId);
    const key: string = 'one_post';

    return this.makeRequestAsGuest(query, key, false);
  }

  private static async makeRequestAsMyself(
    myself: UserModel,
    query: string,
    keyToReturn: string | null = null,
    dataOnly = true,
  ): Promise<any> {
    const myselfClient = this.getClientWithToken(myself);

    const response = await myselfClient.query({ query: gql(query) });

    if (keyToReturn) {
      return dataOnly ? response.data[keyToReturn].data : response.data[keyToReturn];
    }

    return response;
  }

  private static async makeRequestAsGuest(
    query: string,
    keyToReturn: string | null = null,
    dataOnly = true,
  ): Promise<any> {
    const myselfClient = this.getClient();

    const response = await myselfClient.query({ query: gql(query) });

    if (keyToReturn) {
      return dataOnly ? response.data[keyToReturn].data : response.data[keyToReturn];
    }

    return response;
  }

  public static async makeRequest(
    query: string,
    keyToReturn: string | null = null,
    dataOnly = true,
  ): Promise<any> {
    const response = await client.query({ query: gql(query) });

    if (keyToReturn) {
      return dataOnly ? response.data[keyToReturn].data : response.data[keyToReturn];
    }

    return response;
  }

  public static async beforeAll(): Promise<void> {
    serverApp = await app.listen({ port: PORT });
  }

  private static getClientWithToken(user: UserModel) {
    return new ApolloClient({
      request: async (operation) => {
        operation.setContext({
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
      },
      uri: GRAPHQL_URI,
      cache: new InMemoryCache({
        addTypename: false,
      }),
    });
  }

  private static getClient() {
    return new ApolloClient({
      uri: GRAPHQL_URI,
      cache: new InMemoryCache({
        addTypename: false,
      }),
    });
  }

  public static async afterAll(): Promise<void> {
    await serverApp.close();
  }
}
