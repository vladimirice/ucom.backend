import { GraphqlHelper } from '../helpers/graphql-helper';

const mockHelper = require('../helpers/mock-helper.ts');

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
  beforeAll(async () => {
    [userVlad, userJane] = await seedsHelper.beforeAllRoutine();
    await GraphqlHelper.beforeAll();
  });

  afterAll(async () => {
    await Promise.all([
      seedsHelper.doAfterAll(),
      GraphqlHelper.afterAll(),
    ]);
  });

  beforeEach(async () => {
    [userVlad, userJane] = await seedsHelper.beforeAllRoutine();
  });

  describe('Positive', () => {
    it('#smoke - should get repost information', async () => {
      const { repostId }: { repostId: number } =
        await postsGenerator.createUserPostAndRepost(userVlad, userJane);

      const response =
        await GraphqlHelper.getUserWallFeedQueryAsMyself(userVlad, userJane.id, 1, 10);

      const { data } = response;

      const repost = data.find(item => item.id === repostId);

      expect(repost).toBeDefined();

      const options = {
        myselfData: true,
        postProcessing: 'list',
        comments: true,
        commentsMetadataExistence: true,
        commentItselfMetadata: true,
      };

      await commonHelper.checkPostsListFromApi(
        data,
        1,
        options,
      );

      commonHelper.checkOneRepostForList(repost, options, false);
    }, 20000);

    it('#smoke - should get all user-related posts', async () => {

      const str =  '{"code":500,"message":"Internal Service Error","error":{"code":3080006,"name":"deadline_exception","what":"Transaction took too long","details":[]}}';

      if (typeof str === 'string') {

        // @ts-ignore
        const a = 0;
      }

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

      const response = await GraphqlHelper.getUserWallFeedQueryAsMyself(
        userVlad, userVlad.id, feedPage, feedPerPage, commentsPage, commentsPerPage,
      );
      const { data } = response;

      const options = {
        myselfData: true,
        postProcessing: 'list',
        comments: true,
        commentsMetadataExistence: true,
        commentItselfMetadata: true,
      };

      const postOne = data.find(item => item.id === postOneId)!;

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

      const commentWithComment = postOne.comments.data.find(item => item.id === commentOne.id)!;
      const commentWithoutComment = postOne.comments.data.find(item => item.id === commentTwo.id)!;

      expect(commentWithComment.metadata).toBeDefined();
      expect(commentWithComment.metadata.next_depth_total_amount).toBe(1);

      expect(commentWithoutComment.metadata).toBeDefined();
      expect(commentWithoutComment.metadata.next_depth_total_amount).toBe(0);

      await commonHelper.checkPostsListFromApi(
        data,
        promisesToCreatePosts.length,
        options,
      );
    }, JEST_TIMEOUT);
  });
});

export {};
