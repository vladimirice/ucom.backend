import { InMemoryCache } from 'apollo-cache-inmemory';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

const ApolloClient = require('apollo-boost').default;
const { gql } = require('apollo-boost');

const { app, server } = require('../../../graphql-app');

let serverApp;
let client;

require('cross-fetch/polyfill');

const PORT = 4004;

export class GraphqlHelper {
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

  public static async beforeAllWithAuthToken(user: UserModel): Promise<void> {
    serverApp = await app.listen({ port: PORT });

    client = new ApolloClient({
      request: async (operation) => {
        operation.setContext({
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
      },
      uri: `http://127.0.0.1:${PORT}${server.graphqlPath}`,
      cache: new InMemoryCache({
        addTypename: false,
      }),
    });
  }

  public static async afterAll(): Promise<void> {
    await serverApp.close();
  }
}
