import { CommentModel, CommentModelResponse } from '../../../lib/comments/interfaces/model-interfaces';

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

require('cross-fetch/polyfill');

mockHelper.mockAllBlockchainPart();

let userVlad;
let userJane;

const JEST_TIMEOUT = 20000;

describe('#feeds #graphql', () => {
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
    it('#smoke - check depth = 1 comments API', async () => {
      const commentsOfDepthZeroResponses: number = 4;
      const commentsOfDepthOneResponses: number = 5;

      const postId: number = await postsGenerator.createMediaPostByUserHimself(userVlad);

      const comments: CommentModel[] = await commentsGenerator.createManyCommentsForPost(
        postId,
        userVlad,
        3,
      );

      const commentsOfDepthOne: CommentModel[] =
          await commentsGenerator.createManyCommentsForManyComments(
            postId,
            comments,
            userJane,
            commentsOfDepthZeroResponses,
          );

      await commentsGenerator.createManyCommentsForManyComments(
        postId,
        commentsOfDepthOne,
        userVlad,
        commentsOfDepthOneResponses,
      );

      const commentZeroDepth: CommentModel = comments[0];

      const page: number = 1;
      const perPage: number = commentsOfDepthZeroResponses - 1; // check pagination

      // check depth for one commentZeroDepth
      const oneDepthCommentQuery = GraphQLSchema.getCommentsOnCommentQuery(
        postId,
        commentZeroDepth.id,
        commentZeroDepth.depth,
        page,
        perPage,
      );

      const response = await client.query({ query: gql(oneDepthCommentQuery) });

      expect(response.data.comments_on_comment).toBeDefined();
      const { data }: { data: CommentModelResponse[] } = response.data.comments_on_comment;

      expect(data).toBeDefined();
      expect(data.length).toBe(perPage);

      for (const item of data) {
        expect(item.commentable_id).toBe(postId);
        expect(item.parent_id).toBe(commentZeroDepth.id);
        expect(item.metadata.next_depth_total_amount).toBe(commentsOfDepthOneResponses);
      }

      const options = {
        myselfData: true,
        postProcessing: 'list',
        comments: true,
        commentsMetadataExistence: true,
        commentItselfMetadata: true,
      };

      await commonHelper.checkManyCommentsPreviewWithRelations(data, options);
    });

    it('#smoke - comments api with next_depth amount', async () => {
      const commentsOfDepthZeroResponses: number = 4;
      const commentsOfDepthOneResponses: number = 5;

      const postId: number = await postsGenerator.createMediaPostByUserHimself(userVlad);

      const comments: CommentModel[] = await commentsGenerator.createManyCommentsForPost(
        postId,
        userVlad,
        3,
      );

      const commentsOfDepthOne: CommentModel[] =
          await commentsGenerator.createManyCommentsForManyComments(
            postId,
            comments,
            userJane,
            commentsOfDepthZeroResponses,
          );

      await commentsGenerator.createManyCommentsForManyComments(
        postId,
        commentsOfDepthOne,
        userVlad,
        commentsOfDepthOneResponses,
      );

      // Check one more depth level
      // check depth for one commentZeroDepth

      const commentOneDepth: CommentModel = commentsOfDepthOne[0];

      const secondRequestPage: number = 1;
      const secondRequestPerPage: number = commentsOfDepthZeroResponses - 1; // check pagination


      const twoDepthCommentQuery = GraphQLSchema.getCommentsOnCommentQuery(
        postId,
        commentOneDepth.id,
        commentOneDepth.depth,
        secondRequestPage,
        secondRequestPerPage,
      );

      const secondResponse = await client.query({ query: gql(twoDepthCommentQuery) });

      expect(secondResponse.data.comments_on_comment).toBeDefined();
      const { data: secondData }: { data: CommentModelResponse[] } =
          secondResponse.data.comments_on_comment;

      expect(secondData).toBeDefined();
      expect(secondData.length).toBe(secondRequestPerPage);

      for (const item of secondData) {
        expect(item.commentable_id).toBe(postId);
        expect(item.parent_id).toBe(commentOneDepth.id);
        expect(item.metadata.next_depth_total_amount).toBe(0);
      }

      const options = {
        myselfData: true,
        postProcessing: 'list',
        comments: true,
        commentsMetadataExistence: true,
        commentItselfMetadata: true,
      };

      await commonHelper.checkManyCommentsPreviewWithRelations(secondData, options);
    }, JEST_TIMEOUT);

    it('#smoke - should get all depth = 0 comments', async () => {
      const targetUser = userVlad;
      const directPostAuthor = userJane;

      const promisesToCreatePosts = [
        postsGenerator.createMediaPostByUserHimself(targetUser),
        postsGenerator.createUserDirectPostForOtherUser(directPostAuthor, targetUser, null, true),
      ];

      const [postOneId, postTwo] = await Promise.all(promisesToCreatePosts);

      const [commentOne] = await Promise.all([
        commentsGenerator.createCommentForPost(postOneId, userJane),
        commentsGenerator.createCommentForPost(postOneId, userJane),
        commentsGenerator.createCommentForPost(postOneId, userJane),

        // disturbance
        commentsGenerator.createCommentForPost(postTwo.id, userJane),
      ]);

      await Promise.all([
        commentsGenerator.createCommentOnComment(postOneId, commentOne.id, userJane),
        commentsGenerator.createCommentOnComment(postOneId, commentOne.id, userJane),
      ]);

      const page: number = 1;
      const perPage: number = 10;

      const query = gql(GraphQLSchema.getPostCommentsQuery(postOneId, page, perPage));

      const response = await client.query({ query });
      const { data } = response;

      // #task - check all comments with metadata structure as separate helper
      expect(data.feed_comments).toBeDefined();
      expect(data.feed_comments.data).toBeDefined();

      expect(data.feed_comments.data.length).toBe(3);

      const options = {
        myselfData: true,
        postProcessing: 'list',
        comments: true,
        commentsMetadataExistence: true,
        commentItselfMetadata: true,
      };

      await commonHelper.checkManyCommentsPreviewWithRelations(
        data.feed_comments.data,
        options,
      );

      const commentWithComments = data.feed_comments.data.find(item => item.id === commentOne.id);

      expect(commentWithComments.metadata.next_depth_total_amount).toBe(2);
    }, JEST_TIMEOUT);
  });
});
