import { GraphqlHelper } from '../helpers/graphql-helper';
import { GraphqlRequestHelper } from '../../helpers/common/graphql-request-helper';

import CommonHelper = require('../helpers/common-helper');
import PostsGenerator = require('../../generators/posts-generator');
import CommentsGenerator = require('../../generators/comments-generator');

import UsersHelper = require('../helpers/users-helper');
import SeedsHelper = require('../helpers/seeds-helper');
// import CommentsGenerator = require('../../generators/comments-generator');
// import PostsGenerator = require('../../generators/posts-generator');

const mockHelper = require('../helpers/mock-helper.ts');

const postsGenerator = require('../../generators/posts-generator.ts');
const commentsGenerator = require('../../generators/comments-generator.ts');

const commonHelper = require('../helpers/common-helper.ts');
const commentsHelper = require('../helpers/comments-helper.ts');

require('cross-fetch/polyfill');

mockHelper.mockAllBlockchainPart();

let userVlad;
let userJane;

const JEST_TIMEOUT = 20000 * 10;

describe('#Feeds #GraphQL', () => {
  beforeAll(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
    await GraphqlRequestHelper.beforeAll();
  });

  afterAll(async () => {
    await Promise.all([
      SeedsHelper.doAfterAll(),
      GraphqlRequestHelper.afterAll(),
    ]);
  });

  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine(false, true);
  });

  describe('Positive', () => {
    it('Mixed types of posts - comments for all', async () => {
      const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
      const directPostId = await PostsGenerator.createDirectPostForUserAndGetId(userJane, userVlad);

      await CommentsGenerator.createManyCommentsForPost(postId, userJane, 20);
      await CommentsGenerator.createManyCommentsForPost(directPostId, userVlad, 20);

      const commentsPerPage = 3;
      const response = await GraphqlHelper.getUserWallFeedQueryAsMyself(
        userJane,
        userVlad.id,
        1,
        10,
        1,
        commentsPerPage,
      );

      expect(response.data[0].comments.data.length).toBe(commentsPerPage);
      expect(response.data[1].comments.data.length).toBe(commentsPerPage);

      UsersHelper.checkIncludedUserForEntityPage(
        response.data[0],
        UsersHelper.propsAndCurrentParamsOptions(true),
      );
    }, 100000);

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
      const targetUser = userVlad;

      const promisesToCreatePosts = [
        postsGenerator.createMediaPostByUserHimself(targetUser),
        postsGenerator.createUserDirectPostForOtherUser(userJane, targetUser, null, true),
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

      CommonHelper.checkPostListResponseWithoutOrg(response, true, false);
    }, JEST_TIMEOUT);
  });
});

export {};
