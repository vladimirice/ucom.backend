import { InMemoryCache } from 'apollo-cache-inmemory';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import {
  PostModelMyselfResponse,
  PostModelResponse, PostRequestQueryDto,
  PostsListResponse,
} from '../../../lib/posts/interfaces/model-interfaces';
import { CommentsListResponse } from '../../../lib/comments/interfaces/model-interfaces';

import ResponseHelper = require('./response-helper');

const ApolloClient = require('apollo-boost').default;
const { gql } = require('apollo-boost');

const { GraphQLSchema } = require('ucom-libs-graphql-schemas');

const { app, server } = require('../../../graphql-app');

const PORT = 4007;

const GRAPHQL_URI = `http://127.0.0.1:${PORT}${server.graphqlPath}`;

let serverApp;

require('cross-fetch/polyfill');

export class GraphqlHelper {
  public static async beforeAll(): Promise<void> {
    serverApp = await app.listen({ port: PORT });
  }

  public static async afterAll(): Promise<void> {
    await serverApp.close();
  }

  public static async getOnePostAsMyself(
    myself: UserModel,
    postId: number,
  ): Promise<PostModelMyselfResponse> {
    const query: string = GraphQLSchema.getOnePostQueryAsMyself(postId);
    const key: string = 'one_post';

    return this.makeRequestAsMyself(myself, query, key, false);
  }

  public static async getManyMediaPostsAsMyself(
    myself: UserModel,
    postOrdering: string = '-id',
    postPage: number = 1,
    postPerPage: number = 10,
    commentsPage: number = 1,
    commentsPerPage: number = 10,
  ): Promise<PostsListResponse> {
    // @ts-ignore
    const postFiltering: PostRequestQueryDto = {
      post_type_id: 1,
    };

    return this.getManyPostsAsMyself(
      myself,
      postFiltering,
      postOrdering,
      postPage,
      postPerPage,
      commentsPage,
      commentsPerPage,
    );
  }

  public static async getManyPostsAsMyself(
    myself: UserModel,
    postFiltering: PostRequestQueryDto,
    postOrdering: string = '-id',
    postPage: number = 1,
    postPerPage: number = 10,
    commentsPage: number = 1,
    commentsPerPage: number = 10,
  ): Promise<PostsListResponse> {
    const query: string = GraphQLSchema.getPostsQuery(
      postFiltering,
      postOrdering,
      postPage,
      postPerPage,
      commentsPage,
      commentsPerPage,
      true,
    );

    const key: string = 'posts';

    const response: PostsListResponse = await this.makeRequestAsMyself(myself, query, key, false);
    ResponseHelper.expectValidListResponseStructure(response);

    return response;
  }

  public static async getManyPostsAsGuest(
    postFiltering: any,
    postOrdering: string = '-id',
    postPage: number = 1,
    postPerPage: number = 10,
    commentsPage: number = 1,
    commentsPerPage: number = 10,
  ): Promise<PostsListResponse> {
    const query: string = GraphQLSchema.getPostsQuery(
      postFiltering,
      postOrdering,
      postPage,
      postPerPage,
      commentsPage,
      commentsPerPage,
      false,
    );

    const key: string = 'posts';

    const response: PostsListResponse = await this.makeRequestAsGuest(query, key, false);
    ResponseHelper.expectValidListResponseStructure(response);

    return response;
  }

  public static async getUserWallFeedQueryAsMyself(
    myself: UserModel,
    userId: number,
    page: number = 1,
    perPage: number = 10,
    commentsPage: number = 1,
    commentsPerPage: number = 10,
  ): Promise<PostsListResponse> {
    const query: string = GraphQLSchema.getUserWallFeedQuery(
      userId,
      page,
      perPage,
      commentsPage,
      commentsPerPage,
    );

    const key: string = 'user_wall_feed';

    const response: PostsListResponse = await this.makeRequestAsMyself(myself, query, key, false);
    ResponseHelper.expectValidListResponseStructure(response);

    return response;
  }

  public static async getOrgWallFeedAsMyself(
    myself: UserModel,
    orgId: number,
    page: number = 1,
    perPage: number = 10,
    commentsPage: number = 1,
    commentsPerPage: number = 10,
  ): Promise<PostsListResponse> {
    const query: string = GraphQLSchema.getOrganizationWallFeedQuery(
      orgId,
      page,
      perPage,
      commentsPage,
      commentsPerPage,
    );

    const key: string = 'org_wall_feed';

    const response: PostsListResponse = await this.makeRequestAsMyself(myself, query, key, false);
    ResponseHelper.expectValidListResponseStructure(response);

    return response;
  }

  public static async getTagWallFeedAsMyself(
    myself: UserModel,
    tagTitle: string,
    page: number = 1,
    perPage: number = 10,
    commentsPage: number = 1,
    commentsPerPage: number = 10,
  ): Promise<PostsListResponse> {
    const query: string = GraphQLSchema.getTagWallFeedQuery(
      tagTitle,
      page,
      perPage,
      commentsPage,
      commentsPerPage,
    );

    const key: string = 'tag_wall_feed';

    const response: PostsListResponse = await this.makeRequestAsMyself(myself, query, key, false);
    ResponseHelper.expectValidListResponseStructure(response);

    return response;
  }

  public static async getPostCommentsAsMyself(
    myself: UserModel,
    commentableId: number,
    page: number,
    perPage: number,
  ): Promise<CommentsListResponse> {
    const query: string = GraphQLSchema.getPostCommentsQuery(commentableId, page, perPage);
    const key: string = 'feed_comments';

    const response: CommentsListResponse = await this.makeRequestAsMyself(
      myself,
      query,
      key,
      false,
    );
    ResponseHelper.expectValidListResponseStructure(response);

    return response;
  }

  public static async getCommentsOnCommentAsMyself(
    myself: UserModel,
    postId: number,
    parentId: number,
    parentDepth: number,
    page: number,
    perPage: number,
  ): Promise<CommentsListResponse> {
    // check depth for one commentZeroDepth
    const query = GraphQLSchema.getCommentsOnCommentQuery(
      postId,
      parentId,
      parentDepth,
      page,
      perPage,
    );

    const key: string = 'comments_on_comment';

    const response: CommentsListResponse =
      await this.makeRequestAsMyself(myself, query, key, false);
    ResponseHelper.expectValidListResponseStructure(response);

    return response;
  }

  public static async getUserNewsFeed(
    myself: UserModel,
  ): Promise<PostsListResponse> {
    const query: string = GraphQLSchema.getUserNewsFeed(1, 10, 1, 10);
    const key: string = 'user_news_feed';

    const response: PostsListResponse = await this.makeRequestAsMyself(myself, query, key, false);
    ResponseHelper.expectValidListResponseStructure(response);

    return response;
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

    // let response;
    // try {
    const response = await myselfClient.query({ query: gql(query) });
    // } catch (err) {
    // @ts-ignore
    // const a = 0;
    // }

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
}
