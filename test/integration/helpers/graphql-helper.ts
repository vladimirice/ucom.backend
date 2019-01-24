import { InMemoryCache } from 'apollo-cache-inmemory';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import {PostModelMyselfResponse, PostModelResponse} from '../../../lib/posts/interfaces/model-interfaces';

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

  public static async beforeAllWithAuthToken(
    user: UserModel,
  ): Promise<void> {
    serverApp = await app.listen({ port: PORT });

    client = this.getClientWithToken(user);
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
