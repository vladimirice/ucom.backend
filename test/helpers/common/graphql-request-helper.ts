import { InMemoryCache } from 'apollo-cache-inmemory';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { StringToAnyCollection } from '../../../lib/common/interfaces/common-types';

const ApolloClient = require('apollo-boost').default;
const { gql } = require('apollo-boost');

const { GraphQLSchema } = require('ucom-libs-graphql-schemas');

const { app, server } = require('../../../graphql-app');

const PORT = 4007;

const GRAPHQL_URI = `http://127.0.0.1:${PORT}${server.graphqlPath}`;

let serverApp;

require('cross-fetch/polyfill');

export class GraphqlRequestHelper {
  public static async beforeAll(): Promise<void> {
    serverApp = await app.listen({ port: PORT });
  }

  public static async afterAll(): Promise<void> {
    await serverApp.close();
  }

  public static async makeRequestFromQueryPartsAsMyself(
    myself: UserModel,
    parts: string[],
  ): Promise<any> {
    const query = GraphQLSchema.getQueryMadeFromParts(parts);

    return this.makeRequestAsMyself(myself, query);
  }

  public static async makeRequestFromQueryPartsWithAliasesAsMyself(
    myself: UserModel,
    partsWithAliases: StringToAnyCollection,
  ): Promise<any> {
    const query = GraphQLSchema.getQueryMadeFromPartsWithAliases(partsWithAliases);

    const response = await this.makeRequestAsMyself(myself, query);

    return response.data;
  }

  public static async makeRequestFromOneQueryPartAsMyself(
    myself: UserModel,
    queryPart: string,
    key: string,
  ): Promise<any> {
    const query = GraphQLSchema.getQueryMadeFromParts([queryPart]);

    const response = await this.makeRequestAsMyself(myself, query);

    return response.data[key];
  }

  public static async makeRequestAsMyself(
    myself: UserModel,
    query: string,
    keyToReturn: string | null = null,
    dataOnly = true,
  ): Promise<any> {
    const myselfClient = this.getClientWithToken(myself);

    let response;

    try {
      response = await myselfClient.query({ query: gql(query) });
    } catch (error) {
      throw new Error('GraphQL error');
    }

    if (keyToReturn) {
      return dataOnly ? response.data[keyToReturn].data : response.data[keyToReturn];
    }

    return response;
  }

  public static async makeRequestAsGuest(
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

  public static async makeRequestWithHeaders(
    headers: any,
    query: string,
    keyToReturn: string | null = null,
    dataOnly = true,
  ): Promise<any> {
    const client = this.getClientWithHeaders(headers);

    const response = await client.query({ query: gql(query) });

    if (keyToReturn) {
      return dataOnly ? response.data[keyToReturn].data : response.data[keyToReturn];
    }

    return response;
  }

  public static getClientWithToken(user: UserModel) {
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

  public static getClient() {
    return new ApolloClient({
      uri: GRAPHQL_URI,
      cache: new InMemoryCache({
        addTypename: false,
      }),
    });
  }

  public static getClientWithHeaders(headers) {
    return new ApolloClient({
      headers,
      uri: GRAPHQL_URI,
      cache: new InMemoryCache({
        addTypename: false,
      }),
    });
  }
}
