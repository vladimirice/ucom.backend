import { InMemoryCache } from 'apollo-cache-inmemory';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import {
  PostModelMyselfResponse,
  PostModelResponse, PostRequestQueryDto,
  PostsListResponse,
} from '../../../lib/posts/interfaces/model-interfaces';
import { CommentsListResponse } from '../../../lib/comments/interfaces/model-interfaces';
import { OrgListResponse, OrgModelResponse } from '../../../lib/organizations/interfaces/model-interfaces';
import { TagsListResponse } from '../../../lib/tags/interfaces/dto-interfaces';

import ResponseHelper = require('./response-helper');
import TagsHelper = require('./tags-helper');
import EntityListCategoryDictionary = require('../../../lib/stats/dictionary/entity-list-category-dictionary');

const ApolloClient = require('apollo-boost').default;
const { gql } = require('apollo-boost');

const { GraphQLSchema } = require('ucom-libs-graphql-schemas');
const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

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

  public static async getGithubAirdropPostWithoutUser(postId: number): Promise<any> {
    const query: string = GraphQLSchema.getGithubAirdropPost(postId);
    const key: string = 'one_post';

    return this.makeRequestAsGuest(query, key, false);
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
      post_type_id: ContentTypeDictionary.getTypeMediaPost(),
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

  public static async getManyBlockchainNodesAsMyself(
    myself: UserModel,
    ordering: string,
    page: number = 1,
    perPage: number = 10,
  ): Promise<PostsListResponse> {
    const query: string = GraphQLSchema.getManyBlockchainNodes(ordering, page, perPage);

    const key: string = 'many_blockchain_nodes';

    return this.makeRequestAsMyself(myself, query, key, false);
  }

  public static async getManyOrgsDataOnlyAsMyself(
    myself: UserModel,
    ordering: string = '-id',
    page: number = 1,
    perPage: number = 10,
  ): Promise<OrgModelResponse[]> {
    const response: OrgListResponse =
      await this.getManyOrgsAsMyself(myself, ordering, page, perPage);

    return response.data;
  }

  public static async getManyOrgsAsMyself(
    myself: UserModel,
    ordering: string = '-id',
    page: number = 1,
    perPage: number = 10,
  ): Promise<OrgListResponse> {
    const query: string = GraphQLSchema.getOrganizationsQuery(
      ordering,
      page,
      perPage,
    );

    const key: string = 'organizations';

    const response: OrgListResponse = await this.makeRequestAsMyself(myself, query, key, false);
    ResponseHelper.checkListResponseStructure(response);

    return response;
  }

  public static async getManyOrgsForTrending(
    myself: UserModel,
    page: number = 1,
    perPage: number = 10,
  ): Promise<OrgListResponse> {
    const query: string = GraphQLSchema.getManyTrendingOrganizationsQuery(page, perPage);

    return this.makeRequestAsMyself(myself, query, null, false);
  }

  public static async getManyOrgsForHot(
    myself: UserModel,
    page: number = 1,
    perPage: number = 10,
  ): Promise<OrgListResponse> {
    const query: string = GraphQLSchema.getManyHotOrganizationsQuery(page, perPage);

    return this.makeRequestAsMyself(myself, query, null, false);
  }

  public static async getManyOrgsForFresh(
    myself: UserModel,
    page: number = 1,
    perPage: number = 10,
  ): Promise<OrgListResponse> {
    const query: string = GraphQLSchema.getManyFreshOrganizationsQuery(page, perPage);

    return this.makeRequestAsMyself(myself, query, null, false);
  }

  public static async getManyOrgsForTop(
    myself: UserModel,
    page: number = 1,
    perPage: number = 10,
  ): Promise<OrgListResponse> {
    const query: string = GraphQLSchema.getManyTopOrganizationsQuery(page, perPage);

    return this.makeRequestAsMyself(myself, query, null, false);
  }

  public static async getManyTagsForTrending(
    myself: UserModel,
    page: number = 1,
    perPage: number = 10,
  ): Promise<TagsListResponse> {
    const query: string = GraphQLSchema.getManyTrendingTagsQuery(page, perPage);

    return this.makeRequestAsMyself(myself, query, null, false);
  }

  public static async getManyTagsForHot(
    myself: UserModel,
    page: number = 1,
    perPage: number = 10,
  ): Promise<OrgListResponse> {
    const query: string = GraphQLSchema.getManyHotTagsQuery(page, perPage);

    return this.makeRequestAsMyself(myself, query, null, false);
  }

  public static async getManyTagsForFresh(
    myself: UserModel,
    page: number = 1,
    perPage: number = 10,
  ): Promise<OrgListResponse> {
    const query: string = GraphQLSchema.getManyFreshTagsQuery(page, perPage);

    return this.makeRequestAsMyself(myself, query, null, false);
  }

  public static async getManyTagsForTop(
    myself: UserModel,
    page: number = 1,
    perPage: number = 10,
  ): Promise<OrgListResponse> {
    const query: string = GraphQLSchema.getManyTopTagsQuery(page, perPage);

    return this.makeRequestAsMyself(myself, query, null, false);
  }

  public static async getManyTagsAsMyself(
    myself: UserModel,
    ordering: string = '-id',
    page: number = 1,
    perPage: number = 10,
  ): Promise<TagsListResponse> {
    const query: string = GraphQLSchema.getManyTagsQuery(
      ordering,
      page,
      perPage,
    );
    const key: string = 'many_tags';

    const response: TagsListResponse = await this.makeRequestAsMyself(myself, query, key, false);
    ResponseHelper.checkListResponseStructure(response);
    TagsHelper.checkTagsListResponseStructure(response);

    return response;
  }

  public static async getManyTagsAsGuest(
    ordering: string = '-id',
    page: number = 1,
    perPage: number = 10,
  ): Promise<TagsListResponse> {
    const query: string = GraphQLSchema.getManyTagsQuery(
      ordering,
      page,
      perPage,
    );
    const key: string = 'many_tags';

    const response: TagsListResponse = await this.makeRequestAsGuest(query, key, false);
    ResponseHelper.checkListResponseStructure(response);
    TagsHelper.checkTagsListResponseStructure(response);

    return response;
  }

  public static async getManyDirectPostsAsMyself(
    myself: UserModel,
    postOrdering: string = '-id',
    postPage: number = 1,
    postPerPage: number = 10,
    commentsPage: number = 1,
    commentsPerPage: number = 10,
  ): Promise<PostsListResponse> {
    // @ts-ignore
    const postFiltering: PostRequestQueryDto = {
      post_type_id: ContentTypeDictionary.getTypeDirectPost(),
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
    ResponseHelper.checkListResponseStructure(response);

    return response;
  }

  public static async getPostsPageAsMyself(
    myself: UserModel,
    overviewType: string,
    postTypeId: number,
    postPage: number = 1,
    postPerPage: number = 10,
    commentsPage: number = 1,
    commentsPerPage: number = 10,
  ): Promise<PostsListResponse> {
    let query: string;

    switch (overviewType) {
      case EntityListCategoryDictionary.getTrending():
        query = GraphQLSchema.getManyTrendingPostsQuery(
          postTypeId,
          postPage,
          postPerPage,
          commentsPage,
          commentsPerPage,
          true,
        );
        break;
      case EntityListCategoryDictionary.getHot():
        query = GraphQLSchema.getManyHotPostsQuery(
          postTypeId,
          postPage,
          postPerPage,
          commentsPage,
          commentsPerPage,
          true,
        );
        break;
      case EntityListCategoryDictionary.getFresh():
        query = GraphQLSchema.getManyFreshPostsQuery(
          postTypeId,
          postPage,
          postPerPage,
          commentsPage,
          commentsPerPage,
          true,
        );
        break;
      case EntityListCategoryDictionary.getTop():
        query = GraphQLSchema.getManyTopPostsQuery(
          postTypeId,
          postPage,
          postPerPage,
          commentsPage,
          commentsPerPage,
          true,
        );
        break;
      default:
        throw new Error(`Unsupported overview type: ${overviewType}`);
    }

    return this.makeRequestAsMyself(myself, query);
  }

  public static async getPostUsersAsMyself(
    myself: UserModel,
    overviewType: string,
    postTypeId: number,
    page: number = 1,
    perPage: number = 10,
  ): Promise<PostsListResponse> {
    let query: string;

    switch (overviewType) {
      case EntityListCategoryDictionary.getTrending():
        query = GraphQLSchema.getManyUsersForTrendingPostsQuery(
          postTypeId,
          page,
          perPage,
          true,
        );
        break;
      case EntityListCategoryDictionary.getHot():
        query = GraphQLSchema.getManyUsersForHotPostsQuery(
          postTypeId,
          page,
          perPage,
          true,
        );
        break;
      case EntityListCategoryDictionary.getFresh():
        query = GraphQLSchema.getManyUsersForFreshPostsQuery(
          postTypeId,
          page,
          perPage,
          true,
        );
        break;
      case EntityListCategoryDictionary.getTop():
        query = GraphQLSchema.getManyUsersForTopPostsQuery(
          postTypeId,
          page,
          perPage,
          true,
        );
        break;
      default:
        throw new Error(`Unsupported overview type: ${overviewType}`);
    }

    const keyToReturn = 'many_users';

    return this.makeRequestAsMyself(myself, query, keyToReturn, false);
  }

  public static async getPostsOrgsAsMyself(
    myself: UserModel,
    overviewType: string,
    postTypeId: number,
    page: number = 1,
    perPage: number = 10,
  ): Promise<PostsListResponse> {
    let query: string;

    switch (overviewType) {
      case EntityListCategoryDictionary.getTrending():
        query = GraphQLSchema.getManyOrganizationsForTrendingPostsQuery(
          postTypeId,
          page,
          perPage,
          true,
        );
        break;
      case EntityListCategoryDictionary.getHot():
        query = GraphQLSchema.getManyOrganizationsForHotPostsQuery(
          postTypeId,
          page,
          perPage,
          true,
        );
        break;
      case EntityListCategoryDictionary.getFresh():
        query = GraphQLSchema.getManyOrganizationsForFreshPostsQuery(
          postTypeId,
          page,
          perPage,
          true,
        );
        break;
      case EntityListCategoryDictionary.getTop():
        query = GraphQLSchema.getManyOrganizationsForTopPostsQuery(
          postTypeId,
          page,
          perPage,
          true,
        );
        break;
      default:
        throw new Error(`Unsupported overview type: ${overviewType}`);
    }

    const keyToReturn = 'many_organizations';

    return this.makeRequestAsMyself(myself, query, keyToReturn, false);
  }

  public static async getPostsTagsAsMyself(
    myself: UserModel,
    overviewType: string,
    postTypeId: number,
    page: number = 1,
    perPage: number = 10,
  ): Promise<PostsListResponse> {
    let query: string;

    switch (overviewType) {
      case EntityListCategoryDictionary.getTrending():
        query = GraphQLSchema.getManyTagsForTrendingPostsQuery(
          postTypeId,
          page,
          perPage,
          true,
        );
        break;
      case EntityListCategoryDictionary.getHot():
        query = GraphQLSchema.getManyTagsForHotPostsQuery(
          postTypeId,
          page,
          perPage,
          true,
        );
        break;
      case EntityListCategoryDictionary.getFresh():
        query = GraphQLSchema.getManyTagsForFreshPostsQuery(
          postTypeId,
          page,
          perPage,
          true,
        );
        break;
      case EntityListCategoryDictionary.getTop():
        query = GraphQLSchema.getManyTagsForTopPostsQuery(
          postTypeId,
          page,
          perPage,
          true,
        );
        break;
      default:
        throw new Error(`Unsupported overview type: ${overviewType}`);
    }

    const keyToReturn = 'many_tags';

    return this.makeRequestAsMyself(myself, query, keyToReturn, false);
  }

  public static async getTagsUsersAsMyself(
    myself: UserModel,
    overviewType: string,
    page: number = 1,
    perPage: number = 10,
  ): Promise<PostsListResponse> {
    let query: string;

    switch (overviewType) {
      case EntityListCategoryDictionary.getTrending():
        query = GraphQLSchema.getManyUsersForTrendingTagsQuery(
          page,
          perPage,
          true,
        );
        break;
      case EntityListCategoryDictionary.getHot():
        query = GraphQLSchema.getManyUsersForHotTagsQuery(
          page,
          perPage,
          true,
        );
        break;
      case EntityListCategoryDictionary.getFresh():
        query = GraphQLSchema.getManyUsersForFreshTagsQuery(
          page,
          perPage,
          true,
        );
        break;
      case EntityListCategoryDictionary.getTop():
        query = GraphQLSchema.getManyUsersForTopTagsQuery(
          page,
          perPage,
          true,
        );
        break;
      default:
        throw new Error(`Unsupported overview type: ${overviewType}`);
    }

    const keyToReturn = 'many_users';

    return this.makeRequestAsMyself(myself, query, keyToReturn, false);
  }

  public static async getOrgsUsersAsMyself(
    myself: UserModel,
    overviewType: string,
    page: number = 1,
    perPage: number = 10,
  ): Promise<PostsListResponse> {
    let query: string;

    switch (overviewType) {
      case EntityListCategoryDictionary.getTrending():
        query = GraphQLSchema.getManyUsersForTrendingOrganizationsQuery(
          page,
          perPage,
          true,
        );
        break;
      case EntityListCategoryDictionary.getHot():
        query = GraphQLSchema.getManyUsersForHotOrganizationsQuery(
          page,
          perPage,
          true,
        );
        break;
      case EntityListCategoryDictionary.getFresh():
        query = GraphQLSchema.getManyUsersForFreshOrganizationsQuery(
          page,
          perPage,
          true,
        );
        break;
      case EntityListCategoryDictionary.getTop():
        query = GraphQLSchema.getManyUsersForTopOrganizationsQuery(
          page,
          perPage,
          true,
        );
        break;
      default:
        throw new Error(`Unsupported overview type: ${overviewType}`);
    }

    const keyToReturn = 'many_users';

    return this.makeRequestAsMyself(myself, query, keyToReturn, false);
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
    ResponseHelper.checkListResponseStructure(response);

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
    ResponseHelper.checkListResponseStructure(response);

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
    ResponseHelper.checkListResponseStructure(response);

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
    ResponseHelper.checkListResponseStructure(response);

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
    ResponseHelper.checkListResponseStructure(response);

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
    ResponseHelper.checkListResponseStructure(response);

    return response;
  }

  public static async getOneUserAirdrop(
    airdropId: number,
    // @ts-ignore
    cookieWithToken: string,
  ): Promise<any> {
    const filter = {
      airdrop_id: airdropId,
    };

    const query = GraphQLSchema.getOneUserAirdrop(filter);

    const key: string = 'one_user_airdrop';

    return this.makeRequestWithCookie(cookieWithToken, query, key, false);
  }

  public static async getUserNewsFeed(
    myself: UserModel,
  ): Promise<PostsListResponse> {
    const query: string = GraphQLSchema.getUserNewsFeed(1, 10, 1, 10);
    const key: string = 'user_news_feed';

    const response: PostsListResponse = await this.makeRequestAsMyself(myself, query, key, false);
    ResponseHelper.checkListResponseStructure(response);

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

  private static async makeRequestWithCookie(
    cookie: string,
    query: string,
    keyToReturn: string | null = null,
    dataOnly = true,
  ): Promise<any> {
    const client = this.getClientWithCookie(cookie);

    const response = await client.query({ query: gql(query) });

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

  private static getClientWithCookie(cookie: string) {
    return new ApolloClient({
      uri: GRAPHQL_URI,
      headers: {
        cookie,
      },
      cache: new InMemoryCache({
        addTypename: false,
      }),
    });
  }
}
