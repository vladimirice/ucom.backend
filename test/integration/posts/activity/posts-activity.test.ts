import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import RequestHelper = require('../../helpers/request-helper');
import SeedsHelper = require('../../helpers/seeds-helper');
import PostsGenerator = require('../../../generators/posts-generator');
import OrganizationsGenerator = require('../../../generators/organizations-generator');
import PostsHelper = require('../../helpers/posts-helper');
import UsersActivityRepository = require('../../../../lib/users/repository/users-activity-repository');
import NotificationsNotificationsEventIdDictionary = require('../../../../lib/entities/dictionary/notifications-event-id-dictionary');
import NotificationsEventIdDictionary = require('../../../../lib/entities/dictionary/notifications-event-id-dictionary');
import ResponseHelper = require('../../helpers/response-helper');
import PostsRepository = require('../../../../lib/posts/posts-repository');
import UsersModelProvider = require('../../../../lib/users/users-model-provider');
import PostsModelProvider = require('../../../../lib/posts/service/posts-model-provider');
import knex = require('../../../../config/knex');
import CommonChecker = require('../../../helpers/common/common-checker');

const request = require('supertest');

const server = RequestHelper.getApiApplication();

const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;

const JEST_TIMEOUT = 10000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

describe('User to post activity', () => {
  beforeAll(async () => {
    await SeedsHelper.noGraphQlMockAllWorkers();
  });
  afterAll(async () => {
    await SeedsHelper.afterAllWithoutGraphQl();
  });
  beforeEach(async () => {
    [userVlad, userJane, userPetr] = await SeedsHelper.beforeAllRoutine();
  });

  it('List of posts contain different myself data related to users activity', async () => {
    const [postIdToUpvote, postIdToDownvote, postIdToNoVote] = await Promise.all([
      PostsGenerator.createMediaPostByUserHimself(userJane),
      PostsGenerator.createMediaPostByUserHimself(userJane),
      PostsGenerator.createMediaPostByUserHimself(userJane),
    ]);

    await PostsGenerator.createRepostOfUserPost(userVlad, postIdToNoVote);

    await PostsHelper.requestToUpvotePost(userVlad, postIdToUpvote);
    await PostsHelper.requestToDownvotePost(userVlad, postIdToDownvote);
    await PostsHelper.requestToUpvotePost(userPetr, postIdToUpvote); // disturbance

    const res = await request(server)
      .get(`${RequestHelper.getPostsUrl()}?post_type_id=1`)
      .set('Authorization', `Bearer ${userVlad.token}`)
    ;

    const posts = res.body.data;

    const postNoVote = posts.find(post => post.id === postIdToNoVote);
    expect(postNoVote.myselfData.myselfVote).toBe('no_vote');

    const upvotedPost = posts.find(post => post.id === postIdToUpvote);
    expect(upvotedPost.myselfData).toBeDefined();
    expect(upvotedPost.myselfData.myselfVote).toBeDefined();
    expect(upvotedPost.myselfData.myselfVote).toBe('upvote');

    const downvotedPost = posts.find(post => post.id === postIdToDownvote);
    expect(downvotedPost.myselfData.myselfVote).toBe('downvote');
  }, JEST_TIMEOUT);

  describe('Upvote-related tests', () => {
    describe('Positive scenarios', () => {
      it('Jane upvotes organization post of Vlad', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId);

        await PostsHelper.requestToUpvotePost(userJane, postId);

        const activity =
          await UsersActivityRepository.findLastByUserIdAndEntityId(userJane.id, postId);
        expect(activity.event_id).toBe(NotificationsEventIdDictionary.getUserUpvotesPostOfOrg());
      });

      it('Jane upvotes Vlad posts', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

        const body = await PostsHelper.requestToUpvotePost(userJane, postId);
        expect(body.current_vote).toBe(1);

        const changedPost = await PostsRepository.findOneById(postId);

        expect(changedPost.current_vote).toBe(1);

        const activity =
          await UsersActivityRepository.findLastByUserIdAndEntityId(userJane.id, postId);
        expect(+activity.entity_id_to).toBe(+postId);
        expect(activity.event_id).toBe(NotificationsNotificationsEventIdDictionary.getUserUpvotesPostOfOtherUser());

        const indexRecord = await knex(UsersModelProvider.getUsersActivityVoteTableName())
          .where({
            entity_id: postId,
            user_id: userJane.id,
            interaction_type: InteractionTypeDictionary.getUpvoteId(),
            entity_name: PostsModelProvider.getEntityName(),
          });

        CommonChecker.expectNotEmpty(indexRecord);
      }, JEST_TIMEOUT);
    });

    describe('Negative scenarios', () => {
      it('Not possible to vote twice', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

        await PostsHelper.requestToUpvotePost(userJane, postId);

        const responseTwo = await request(server)
          .post(`/api/v1/posts/${postId}/upvote`)
          .set('Authorization', `Bearer ${userJane.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(responseTwo);
      }, JEST_TIMEOUT);

      it('Not possible to vote by myself post', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/upvote`)
          .set('Authorization', `Bearer ${userVlad.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(res);
      }, JEST_TIMEOUT);

      it('Should return 400 if postID is not a valid integer', async () => {
        const postId = 'invalidPostId';

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/upvote`)
          .set('Authorization', `Bearer ${userJane.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(res);
      });
      it('Should return 404 if on post with provided ID', async () => {
        const postId = '100500';

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/upvote`)
          .set('Authorization', `Bearer ${userJane.token}`)
        ;

        ResponseHelper.expectStatusNotFound(res);
      });
      it('Not possible to upvote without auth token', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/upvote`)
        ;

        ResponseHelper.expectStatusUnauthorized(res);
      });
    });
  });

  describe('Downvote-related tests', () => {
    describe('Positive scenarios', () => {
      it('Jane downvotes post', async () => {
        const whoVotes = userJane;

        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

        const body = await PostsHelper.requestToDownvotePost(whoVotes, postId);
        expect(body.current_vote).toBeDefined();
        expect(body.current_vote).toBe(-1);

        const postVoteAfter = await PostsRepository.getPostCurrentVote(postId);
        expect(postVoteAfter).toBe(-1);

        const usersActivity =
          await UsersActivityRepository.findLastByUserIdAndEntityId(whoVotes.id, postId);
        expect(+usersActivity.entity_id_to).toBe(+postId);
        expect(usersActivity.event_id).toBe(NotificationsEventIdDictionary.getUserDownvotesPostOfOtherUser());

        const indexRecord = await knex(UsersModelProvider.getUsersActivityVoteTableName())
          .where({
            entity_id: postId,
            user_id: userJane.id,
            interaction_type: InteractionTypeDictionary.getDownvoteId(),
            entity_name: PostsModelProvider.getEntityName(),
          });

        CommonChecker.expectNotEmpty(indexRecord);
      });

      it('Jane DOWNVOTE organization post of Vlad', async () => {
        const orgId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
        const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgId);

        await PostsHelper.requestToDownvotePost(userJane, postId);

        const activity =
          await UsersActivityRepository.findLastByUserIdAndEntityId(userJane.id, postId);
        expect(activity.event_id).toBe(NotificationsEventIdDictionary.getUserDownvotesPostOfOrg());
      });
    });
    describe('Negative scenarios', () => {
      it('Not possible to downvote twice', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
        const whoVotes = userJane;

        await PostsHelper.requestToDownvotePost(whoVotes, postId);

        const responseTwo = await request(server)
          .post(`/api/v1/posts/${postId}/downvote`)
          .set('Authorization', `Bearer ${whoVotes.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(responseTwo);
      }, JEST_TIMEOUT);

      it('Not possible to vote by myself post', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/downvote`)
          .set('Authorization', `Bearer ${userVlad.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(res);
      }, JEST_TIMEOUT);
      it('Should return 400 if postID is not a valid integer', async () => {
        const postId = 'invalidPostId';

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/downvote`)
          .set('Authorization', `Bearer ${userJane.token}`)
        ;

        ResponseHelper.expectStatusBadRequest(res);
      });
      it('Should return 404 if on post with provided ID', async () => {
        const postId = '100500';

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/downvote`)
          .set('Authorization', `Bearer ${userJane.token}`)
        ;

        ResponseHelper.expectStatusNotFound(res);
      });
      it('Not possible to upvote without auth token', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

        const res = await request(server)
          .post(`/api/v1/posts/${postId}/downvote`)
        ;

        ResponseHelper.expectStatusUnauthorized(res);
      });
    });
  });
});

export {};
