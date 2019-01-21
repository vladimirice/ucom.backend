import { CommentModel, CommentModelResponse } from '../../../lib/comments/interfaces/model-interfaces';

import RequestHelper = require('../helpers/request-helper');

export {};

const ApolloClient = require('apollo-boost').default;
const { gql } = require('apollo-boost');
const { InMemoryCache } = require('apollo-cache-inmemory');

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

const JEST_TIMEOUT = 20000;

describe('#Feeds. #GraphQL', () => {
  let serverApp;
  let client;

  beforeAll(async () => {
    [userVlad, userJane] = await seedsHelper.beforeAllRoutine();

    serverApp = await app.listen({ port: 4001 });

    client = new ApolloClient({
      request: async (operation) => {
        operation.setContext({
          headers: {
            Authorization: `Bearer ${userVlad.token}`,
          },
        });
      },
      uri: `http://127.0.0.1:4001${server.graphqlPath}`,
      cache: new InMemoryCache({
        addTypename: false,
      }),
    });
  });

  afterAll(async () => {
    await Promise.all([
      seedsHelper.sequelizeAfterAll(),
      serverApp.close(),
    ]);
  });

  beforeEach(async () => {
    await seedsHelper.initUsersOnly();
  });

  describe('Feed', () => {
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
        const oneDepthCommentQuery = RequestHelper.getCommentOnCommentGraphQlQuery(
          postId,
          commentZeroDepth.id,
          commentZeroDepth.depth,
          page,
          perPage,
        );

        const response = await client.query({ query: oneDepthCommentQuery });

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


        const twoDepthCommentQuery = RequestHelper.getCommentOnCommentGraphQlQuery(
          postId,
          commentOneDepth.id,
          commentOneDepth.depth,
          secondRequestPage,
          secondRequestPerPage,
        );

        const secondResponse = await client.query({ query: twoDepthCommentQuery });

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

        const query = gql`
query {
  feed_comments(commentable_id: ${postOneId}, page: ${page}, per_page: ${perPage}) {
    data {
      id
      description
      current_vote
      blockchain_id
      commentable_id
      created_at
      activity_user_comment
      organization
      depth
      organization_id
      parent_id
      path
      updated_at
      user_id

      metadata {
        next_depth_total_amount
      }

      User {
        id
        account_name
        first_name
        last_name
        nickname
        avatar_filename
        current_rate
      }

      myselfData {
        myselfVote
      }
    }
    metadata {
      page
      per_page
      has_more
    }
  }
}
    `;

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

  describe('Users wall feed', () => {
    describe('Positive', () => {
      it('#smoke - should get all user-related posts as Guest', async () => {
        const targetUser = userVlad;
        const directPostAuthor = userJane;

        const promisesToCreatePosts = [
          postsGenerator.createMediaPostByUserHimself(targetUser),
          postsGenerator.createUserDirectPostForOtherUser(directPostAuthor, targetUser, null, true),
        ];

        const [postOneId, postTwo] = await Promise.all(promisesToCreatePosts);

        const [commentOne, commentTwo] = await Promise.all([
          commentsGenerator.createCommentForPost(
            postOneId,
            userJane,
            'Jane comments - for post one',
          ),
          commentsGenerator.createCommentForPost(postOneId, userJane, 'Comment two for post two'),
          commentsGenerator.createCommentForPost(postTwo.id, userJane, 'Comment two for post two'),
        ]);

        const commentOnComment = await commentsGenerator.createCommentOnComment(
          postOneId,
          commentOne.id,
          userJane,
        );

        await commentsHelper.requestToUpvoteComment(postOneId, commentOne.id, userVlad);

        const query = gql`
query {
  user_wall_feed(user_id: 1, page: 1, per_page: 3) {
    data {
     id
     title
     post_type_id
     leading_text
     description
     user_id
     blockchain_id

     created_at
     updated_at

     main_image_filename
     entity_images


     comments_count
     current_vote
     current_rate

     entity_id_for
     entity_name_for

     organization_id

     comments {
      data {
        id
        description
        current_vote

        metadata {
          next_depth_total_amount
        }

        User {
          id
          account_name
          first_name
          last_name
          nickname
          avatar_filename
          current_rate
        }

        blockchain_id
        commentable_id
        created_at
        activity_user_comment
        organization

        depth
        myselfData {
          myselfVote
        }
        organization_id
        parent_id
        path
        updated_at
        user_id
      }
      metadata {
        page
        per_page
        has_more
      }
     }

     myselfData {
      myselfVote
      join
      organization_member
     }

     User {
      id
      account_name
      first_name
      last_name
      nickname
      avatar_filename
      current_rate
     }
   }

    metadata {
      page
      per_page
      has_more
    }
  }
}
    `;

        const response = await client.query({ query });
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
        expect(postOne.comments.data.length).toBe(2);

        const postOneCommentsMetadata = postOne.comments.metadata;
        expect(postOneCommentsMetadata).toBeDefined();

        expect(postOneCommentsMetadata.page).toBe(1);
        expect(postOneCommentsMetadata.per_page).toBe(10);
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
});
