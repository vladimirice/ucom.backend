import { PostModelResponse } from '../../../lib/posts/interfaces/model-interfaces';

import CommonGenerator = require('../../generators/common-generator');
import OrganizationsHelper = require('../helpers/organizations-helper');

const ApolloClient = require('apollo-boost').default;
const { gql } = require('apollo-boost');
const { InMemoryCache } = require('apollo-cache-inmemory');
const { GraphQLSchema } = require('ucom-libs-graphql-schemas');
const mockHelper = require('../helpers/mock-helper.ts');

const { app, server } = require('../../../graphql-app');
const seedsHelper = require('../helpers/seeds-helper.ts');

require('cross-fetch/polyfill');

mockHelper.mockAllBlockchainPart();

let userVlad;
let userJane;
let userPetr;
let userRokky;

const JEST_TIMEOUT = 20000;

describe('#feeds myself news feed. #graphql', () => {
  let serverApp;
  // @ts-ignore
  let client;

  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await seedsHelper.beforeAllRoutine();

    serverApp = await app.listen({ port: 4002 });

    client = new ApolloClient({
      request: async (operation) => {
        operation.setContext({
          headers: {
            Authorization: `Bearer ${userVlad.token}`,
          },
        });
      },
      uri: `http://127.0.0.1:4002${server.graphqlPath}`,
      cache: new InMemoryCache({
        addTypename: false,
      }),
    });
  });

  afterAll(async () => {
    await Promise.all([
      seedsHelper.doAfterAll(),
      serverApp.close(),
    ]);
  });

  beforeEach(async () => {
    [userVlad, userJane] = await seedsHelper.beforeAllRoutine();
  });

  describe('Positive', () => {
    it('#smoke - myself news feed', async () => {
      const seeds = await CommonGenerator.createFeedsForAllUsers(
        userVlad,
        userJane,
        userPetr,
        userRokky,
      );

      const [
        vladMediaPost, vladDirectPost,
        janeMediaPost, janeDirectPost,
        petrMediaPost, petrDirectPost,

        // @ts-ignore
        rokkyMediaPost, rokkyDirectPost,

        janeMediaPostOrgId, janeDirectPostOrg,
      ] = seeds.posts;

      const query = gql(GraphQLSchema.getUserNewsFeed(1, 10, 1, 10));

      const response = await client.query({ query });
      const { data } = response;

      const posts = data.user_news_feed.data;

      expect(posts.some(post => post.id === vladMediaPost)).toBeTruthy();
      expect(posts.some(post => post.id === vladDirectPost.id)).toBeTruthy();

      expect(posts.some(post => post.id === janeMediaPost)).toBeTruthy();
      expect(posts.some(post => post.id === janeDirectPost.id)).toBeTruthy();

      expect(posts.some(post => post.id === petrMediaPost)).toBeTruthy();
      expect(posts.some(post => post.id === petrDirectPost.id)).toBeTruthy();

      expect(posts.some(post => post.id === janeDirectPostOrg.id)).toBeTruthy();

      const janeMediaPostOrgModel: PostModelResponse =
        posts.find(post => post.id === janeMediaPostOrgId);
      expect(janeMediaPostOrgModel).toBeTruthy();

      expect(janeMediaPostOrgModel.organization_id).toBe(seeds.orgs[userJane.id][0]);
      OrganizationsHelper.checkOneOrganizationPreviewFields(janeMediaPostOrgModel.organization);

    }, JEST_TIMEOUT);
  });
});

export {};
