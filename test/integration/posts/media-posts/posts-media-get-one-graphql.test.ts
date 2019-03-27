import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';
import { PostModelMyselfResponse, PostModelResponse } from '../../../../lib/posts/interfaces/model-interfaces';
import { CheckerOptions } from '../../../generators/interfaces/dto-interfaces';
import { GraphqlHelper } from '../../helpers/graphql-helper';

import SeedsHelper = require('../../helpers/seeds-helper');
import CommonHelper = require('../../helpers/common-helper');
import PostsGenerator = require('../../../generators/posts-generator');

import CommentsGenerator = require('../../../generators/comments-generator');
import UsersHelper = require('../../helpers/users-helper');
import PostsHelper = require('../../helpers/posts-helper');
import OrganizationsGenerator = require('../../../generators/organizations-generator');
import OrganizationsHelper = require('../../helpers/organizations-helper');
import ActivityHelper = require('../../helpers/activity-helper');
import { GraphqlRequestHelper } from '../../../helpers/common/graphql-request-helper';

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 10000;

describe('Get One media post #graphql', () => {
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine(true);

    await GraphqlRequestHelper.beforeAll();
  });

  afterEach(async () => {
    await Promise.all([
      GraphqlRequestHelper.afterAll(),
    ]);
  });

  afterAll(async () => {
    await Promise.all([
      SeedsHelper.doAfterAll(),
      GraphqlRequestHelper.afterAll(),
    ]);
  });

  describe('Positive', () => {
    it('Get one media post WITHOUT comments as myself. #smoke #myself #media-post', async () => {
      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

      const post: PostModelResponse = await GraphqlHelper.getOnePostAsMyself(userVlad, postId);

      CommonHelper.checkOnePostV2WithoutOrg(post, true, true, true);
    }, JEST_TIMEOUT);

    it('Get one media post WITH comments as myself. #smoke #myself #media-post #comments', async () => {
      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

      const [commentOne, commentTwo] =
        await CommentsGenerator.createManyCommentsForPost(postId, userJane, 2);

      const post: PostModelResponse = await GraphqlHelper.getOnePostAsMyself(userVlad, postId);

      const { comments } = post;

      expect(comments.data.length).toBe(2);
      expect(comments.data.some(item => item.id === commentOne.id)).toBeTruthy();
      expect(comments.data.some(item => item.id === commentTwo.id)).toBeTruthy();

      const options: CheckerOptions = {
        myselfData    : true,
        postProcessing: 'full',
        comments: {
          isEmpty: false,
        },
      };

      CommonHelper.checkOnePostV2(post, options);
    }, JEST_TIMEOUT);

    it('Get one media post WITHOUT comments as GUEST. #smoke #guest #media-post', async () => {
      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

      const post: PostModelResponse = await GraphqlHelper.getOnePostAsGuest(postId);

      const options: CheckerOptions = {
        myselfData    : false,
        postProcessing: 'full',
        comments: {
          isEmpty: true,
        },
      };

      CommonHelper.checkOnePostV2(post, options);
    }, JEST_TIMEOUT);

    it('Get one media post WITH comments as GUEST. #smoke #guest #media-post #comments', async () => {
      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

      const [commentOne, commentTwo] =
        await CommentsGenerator.createManyCommentsForPost(postId, userJane, 2);

      const post: PostModelResponse = await GraphqlHelper.getOnePostAsGuest(postId);

      const { comments } = post;

      expect(comments.data.length).toBe(2);
      expect(comments.data.some(item => item.id === commentOne.id)).toBeTruthy();
      expect(comments.data.some(item => item.id === commentTwo.id)).toBeTruthy();

      const options: CheckerOptions = {
        myselfData    : false,
        postProcessing: 'full',
        comments: {
          isEmpty: false,
        },
      };

      CommonHelper.checkOnePostV2(post, options);
    }, JEST_TIMEOUT);
  });

  describe('Related checks', () => {
    it('User data inside post is normalized', async () => {
      await UsersHelper.setSampleRateToUser(userVlad);
      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userVlad);

      const post: PostModelResponse = await GraphqlHelper.getOnePostAsMyself(userVlad, postId);

      const author = post.User;

      expect(+author.current_rate).toBeGreaterThan(0);
    });

    it('Upvote/downvote data inside post', async () => {
      const postId: number = await PostsGenerator.createMediaPostByUserHimself(userJane);

      await PostsHelper.requestToUpvotePost(userVlad, postId);

      const post: PostModelMyselfResponse =
        await GraphqlHelper.getOnePostAsMyself(userVlad, postId);

      expect(post.current_vote).toBe(1);

      expect(post.myselfData.myselfVote).toBe('upvote');
    });
  });

  it('Should contain organization data', async () => {
    const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);

    const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId);

    const post: PostModelMyselfResponse =
      await GraphqlHelper.getOnePostAsMyself(userVlad, postId);

    expect(post.organization_id).toBe(orgId);

    OrganizationsHelper.checkOneOrganizationPreviewFields(post.organization);
  });

  it('should contain myself member data if is got by org author', async () => {
    const orgId: number = await OrganizationsGenerator.createOrgWithTeam(userJane, [userVlad]);

    await UsersHelper.directlySetUserConfirmsInvitation(orgId, userVlad);
    const postId: number = await PostsGenerator.createMediaPostOfOrganization(userJane, orgId);

    await ActivityHelper.requestToFollowOrganization(orgId, userVlad);

    const post: PostModelMyselfResponse = await GraphqlHelper.getOnePostAsMyself(userVlad, postId);

    const { myselfData } = post;
    expect(myselfData).toBeDefined();

    expect(myselfData.organization_member).toBeDefined();
    expect(myselfData.organization_member).toBeTruthy();
  });
});

export {};
