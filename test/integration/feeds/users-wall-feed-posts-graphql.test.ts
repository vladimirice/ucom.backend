export {};

const ApolloClient = require('apollo-boost').default;
const { gql } = require('apollo-boost');
const { InMemoryCache } = require('apollo-cache-inmemory');

const { GraphQLSchema } = require('ucom-libs-graphql-schemas');

const mockHelper = require('../helpers/mock-helper.ts');

const { app, server } = require('../../../graphql-app');

const postsGenerator = require('../../generators/posts-generator.ts');
const commentsGenerator = require('../../generators/comments-generator.ts');

const seedsHelper = require('../helpers/seeds-helper.ts');
const commonHelper = require('../helpers/common-helper.ts');
const commentsHelper = require('../helpers/comments-helper.ts');

require('cross-fetch/polyfill');

mockHelper.mockAllBlockchainPart();

let userVlad;
let userJane;

const JEST_TIMEOUT = 20000 * 10;

describe('#Feeds #GraphQL', () => {
  let serverApp;
  let client;

  beforeAll(async () => {
    [userVlad, userJane] = await seedsHelper.beforeAllRoutine();

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
    it('#smoke - should get repost information', async () => {
      const { repostId }: { repostId: number } =
          await postsGenerator.createUserPostAndRepost(userVlad, userJane);

      const query = gql(GraphQLSchema.getUserWallFeedQuery(userJane.id, 1, 10, 1, 10));

      const response = await client.query({ query });
      const { data } = response;

      // @ts-ignore
      const repost = data.user_wall_feed.data.find(item => item.id === repostId);

      expect(repost).toBeDefined();

      const options = {
        myselfData: true,
        postProcessing: 'list',
        comments: true,
        commentsMetadataExistence: true,
        commentItselfMetadata: true,
      };

      await commonHelper.checkPostsListFromApi(
        data.user_wall_feed.data,
        1,
        options,
      );

      commonHelper.checkOneRepostForList(repost, options, false);
    }, 20000);

    it('#smoke - should get all user-related posts', async () => {
      const targetUser = userVlad;
      const directPostAuthor = userJane;

      const promisesToCreatePosts = [
        postsGenerator.createMediaPostByUserHimself(targetUser),
        postsGenerator.createUserDirectPostForOtherUser(directPostAuthor, targetUser, null, true),
      ];

      const [postOneId, postTwo] = await Promise.all(promisesToCreatePosts);

      // @ts-ignore
      const [commentOne, commentTwo, commentThree] = await Promise.all([
        commentsGenerator.createCommentForPost(
          postOneId,
          userJane,
          'Jane comments - for post one',
        ),
        commentsGenerator.createCommentForPost(postOneId, userJane, 'Comment 1 two for post two'),
        commentsGenerator.createCommentForPost(postOneId, userJane, 'Comment 2 two for post two2'),

        commentsGenerator.createCommentForPost(postTwo.id, userJane, 'Comment 3 two for post two'),
      ]);

      const commentOnComment = await commentsGenerator.createCommentOnComment(
        postOneId,
        commentOne.id,
        userJane,
      );

      await commentsHelper.requestToUpvoteComment(postOneId, commentOne.id, userVlad);

      const commentsPage = 1;
      const commentsPerPage = 10;

      const feedPage = 1;
      const feedPerPage = 3;

      const queryAsString = GraphQLSchema.getUserWallFeedQuery(
        userVlad.id, feedPage, feedPerPage, commentsPage, commentsPerPage,
      );

      const response = await client.query({ query: gql(queryAsString) });
      const { data } = response;

      const options = {
        myselfData: true,
        postProcessing: 'list',
        comments: true,
        commentsMetadataExistence: true,
        commentItselfMetadata: true,
      };

      const postOne = data.user_wall_feed.data.find(item => item.id === postOneId);

      // Only first level comments (depth = 0)
      const commentOnCommentExistence = postOne.comments.data.some(
        item => item.id === commentOnComment.id,
      );
      expect(commentOnCommentExistence).toBeFalsy();
      expect(postOne.comments.data.length).toBe(3);

      const expectedPostOneLastCommentId = 1;
      expect(postOne.comments.data[0].id).toBe(expectedPostOneLastCommentId);

      const postOneCommentsMetadata = postOne.comments.metadata;
      expect(postOneCommentsMetadata).toBeDefined();

      expect(postOneCommentsMetadata.page).toBe(commentsPage);
      expect(postOneCommentsMetadata.per_page).toBe(commentsPerPage);
      expect(postOneCommentsMetadata.has_more).toBeFalsy();

      const commentWithComment = postOne.comments.data.find(item => item.id === commentOne.id);
      const commentWithoutComment = postOne.comments.data.find(item => item.id === commentTwo.id);

      expect(commentWithComment.metadata).toBeDefined();
      expect(commentWithComment.metadata.next_depth_total_amount).toBe(1);

      expect(commentWithoutComment.metadata).toBeDefined();
      expect(commentWithoutComment.metadata.next_depth_total_amount).toBe(0);

      await commonHelper.checkPostsListFromApi(
        data.user_wall_feed.data,
        promisesToCreatePosts.length,
        options,
      );
    }, JEST_TIMEOUT);
  });
});
