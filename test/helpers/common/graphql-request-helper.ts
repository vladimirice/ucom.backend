import { InMemoryCache } from 'apollo-cache-inmemory';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { StringToAnyCollection } from '../../../lib/common/interfaces/common-types';

import NumbersHelper = require('../../../lib/common/helper/numbers-helper');
import RequestHelper = require('../../integration/helpers/request-helper');

const ApolloClient = require('apollo-boost').default;
const { gql } = require('apollo-boost');

const { GraphQLSchema } = require('ucom-libs-graphql-schemas');

const { app, server } = require('../../../lib/graphql/applications/graphql-application');

const PORT = NumbersHelper.generateRandomInteger(4100, 4800);

const GRAPHQL_HOST = `http://127.0.0.1:${PORT}`;
const GRAPHQL_URI = `${GRAPHQL_HOST}${server.graphqlPath}`;

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

  public static async makeRequestFromOneQueryPartByFetch(
    part: string,
    key: string | null = null,
    myself: UserModel | null = null,
  ): Promise<any> {
    return this.makeRequestFromQueryPartsByFetch([part], key, myself);
  }

  public static async makeRequestFromQueryPartsByFetch(
    parts: string[],
    key: string | null = null,
    myself: UserModel | null = null,
  ): Promise<any> {
    const query = GraphQLSchema.getQueryMadeFromParts(parts);

    const headers = {};

    if (myself !== null) {
      RequestHelper.addAuthBearerHeaderOfMyself(headers, myself);
    }

    const data = await this.makeRequestViaFetch(query, headers);

    return key ? data[key] : data;
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

  public static async makeRequestViaFetch(
    query: string,
    headers: any = {},
  ): Promise<any> {
    const response = await fetch(GRAPHQL_URI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ query }),
    });

    const json = await response.json();
    const { data } = json;

    if (json.errors) {
      // eslint-disable-next-line no-console
      console.dir(json.errors);
      throw new Error('GraphQL request error');
    }

    return data;
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
