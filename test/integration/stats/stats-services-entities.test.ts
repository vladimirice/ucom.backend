import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { EntityJobExecutorService } from '../../../lib/stats/service/entity-job-executor-service';
import { EntityEventParamDto } from '../../../lib/stats/interfaces/model-interfaces';
import { EntityEventRepository } from '../../../lib/stats/repository/entity-event-repository';

import SeedsHelper = require('../helpers/seeds-helper');
import PostsHelper = require('../helpers/posts-helper');
import PostsGenerator = require('../../generators/posts-generator');
import EventParamTypeDictionary = require('../../../lib/stats/dictionary/event-param/event-param-type-dictionary');
import _ = require('lodash');
import CommentsGenerator = require('../../generators/comments-generator');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import OrganizationsHelper = require('../helpers/organizations-helper');
import CommonGenerator = require('../../generators/common-generator');

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;
let userRokky: UserModel;

const beforeAfterOptions = {
  isGraphQl: false,
  workersMocking: 'all',
};

const  JEST_TIMEOUT = 10000;

// #task - these are is unit tests
describe('Stats services', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(beforeAfterOptions); });
  afterAll(async () => { await SeedsHelper.doAfterAll(beforeAfterOptions); });
  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();
  });

  it('check activity index for posts', async () => {
    const batchSize = 2;

    const [firstPostId, secondPostId, thirdPostId, fourthPostId, fifthPostId] = await Promise.all([
      PostsGenerator.createMediaPostByUserHimself(userVlad),
      PostsGenerator.createMediaPostByUserHimself(userVlad),
      PostsGenerator.createMediaPostByUserHimself(userVlad),

      PostsGenerator.createMediaPostByUserHimself(userVlad),
      PostsGenerator.createMediaPostByUserHimself(userVlad),
    ]);

    // First post
    // activity_index = 16.5
    // number_of_comments_with_replies = 4
    // number_of_reposts = 1
    // number_of_upvotes = 3
    // number_of_downvotes = 0

    // Second post
    // activity_index = 9
    // number_of_comments_with_replies = 1
    // number_of_reposts = 2
    // number_of_upvotes = 2
    // number_of_downvotes = 1

    // Third post
    // activity_index = 3
    // number_of_comments_with_replies = 0
    // number_of_reposts = 0
    // number_of_upvotes = 0
    // number_of_downvotes = 3

    // Fourth post
    // activity_index = 1.5
    // number_of_comments_with_replies = 0
    // number_of_reposts = 1
    // number_of_upvotes = 0
    // number_of_downvotes = 0

    // Fifth post
    // activity_index = 12
    // number_of_comments_with_replies = 4
    // number_of_reposts = 0
    // number_of_upvotes = 0
    // number_of_downvotes = 0

    await CommonGenerator.createPostRepostActivity(userJane, userPetr, fourthPostId);
    await CommonGenerator.createPostCommentsActivity(
      userVlad,
      userJane,
      userPetr,
      userRokky,
      fifthPostId,
    );

    await CommonGenerator.createPostRepostActivity(userJane, userPetr, firstPostId, secondPostId);
    await CommonGenerator.createPostCommentsActivity(
      userVlad,
      userJane,
      userPetr,
      userRokky,
      firstPostId,
      secondPostId,
    );

    await CommonGenerator.createPostVotingActivity(
      userJane,
      userPetr,
      userRokky,
      firstPostId,
      secondPostId,
      thirdPostId,
    );

    await EntityJobExecutorService.processEntityEventParam(batchSize);

    const events: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithPostEntityName(
        EventParamTypeDictionary.getPostCurrentActivityIndex(),
      );

    expect(_.isEmpty(events)).toBeFalsy();

    expect(events.length).toBe(5);
    // TODO check activity content
  });

  it('calculate organization followers amount', async () => {
    const batchSize = 2;
    const [orgOneId, orgTwoId, orgThreeId, orgFourId] = await Promise.all([
      OrganizationsGenerator.createOrgWithoutTeam(userVlad),
      OrganizationsGenerator.createOrgWithoutTeam(userJane),
      OrganizationsGenerator.createOrgWithoutTeam(userPetr),
      OrganizationsGenerator.createOrgWithoutTeam(userRokky),
    ]);

    await OrganizationsHelper.requestToCreateOrgFollowHistory(userJane, orgOneId);
    await OrganizationsHelper.requestToFollowOrganization(orgOneId, userPetr);
    await OrganizationsHelper.requestToCreateOrgUnfollowHistory(userRokky, orgOneId);

    await OrganizationsHelper.requestToFollowOrganization(orgTwoId, userPetr);
    await OrganizationsHelper.requestToCreateOrgUnfollowHistory(userVlad, orgTwoId);
    await OrganizationsHelper.requestToCreateOrgUnfollowHistory(userRokky, orgTwoId);

    await OrganizationsHelper.requestToFollowOrganization(orgThreeId, userRokky);

    await EntityJobExecutorService.processEntityEventParam(batchSize);

    const events: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithOrgEntityName(
        EventParamTypeDictionary.getOrgFollowersCurrentAmount(),
      );

    expect(_.isEmpty(events)).toBeFalsy();

    expect(events.length).toBe(3);

    const orgOneEvent    = events.find(item => +item.entity_id === orgOneId)!;
    const orgTwoEvent    = events.find(item => +item.entity_id === orgTwoId)!;
    const orgThreeEvent    = events.find(item => +item.entity_id === orgThreeId)!;
    expect(events.some(item => +item.entity_id === orgFourId)).toBeFalsy();

    expect(orgOneEvent.json_value.data).toEqual({ followers: 2 });
    expect(+orgOneEvent.result_value).toBe(2);

    expect(orgTwoEvent.json_value.data).toEqual({ followers: 1 });
    expect(+orgTwoEvent.result_value).toBe(1);

    expect(orgThreeEvent.json_value.data).toEqual({ followers: 1 });
    expect(+orgThreeEvent.result_value).toBe(1);
  });

  it('calculate organization-related posts', async () => {
    const batchSize = 2;
    const [orgOneId, orgTwoId, orgThreeId, orgFourId] = await Promise.all([
      OrganizationsGenerator.createOrgWithoutTeam(userVlad),
      OrganizationsGenerator.createOrgWithoutTeam(userJane),
      OrganizationsGenerator.createOrgWithoutTeam(userRokky),
      OrganizationsGenerator.createOrgWithoutTeam(userJane),
    ]);

    await Promise.all([
      PostsGenerator.createManyMediaPostsOfOrganization(userVlad, orgOneId, 3),
      PostsGenerator.createDirectPostForOrganization(userJane, orgOneId),
      PostsGenerator.createDirectPostForOrganization(userPetr, orgOneId),

      PostsGenerator.createDirectPostForOrganization(userPetr, orgTwoId),
      PostsGenerator.createMediaPostOfOrganization(userRokky, orgThreeId),
    ]);

    await EntityJobExecutorService.processEntityEventParam(batchSize);

    const postEvents: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithOrgEntityName(
        EventParamTypeDictionary.getOrgPostsCurrentAmount(),
      );

    expect(_.isEmpty(postEvents)).toBeFalsy();

    expect(postEvents.length).toBe(3);

    const postOneEvent    = postEvents.find(item => +item.entity_id === orgOneId)!;
    const postTwoEvent    = postEvents.find(item => +item.entity_id === orgTwoId)!;
    const postThreeEvent  = postEvents.find(item => +item.entity_id === orgThreeId)!;
    expect(postEvents.some(item => +item.entity_id === orgFourId)).toBeFalsy();

    expect(postOneEvent.json_value.data).toEqual({
      media_posts: 3,
      direct_posts: 2,
      total: 5,
    });
    expect(+postOneEvent.result_value).toBe(5);

    expect(postTwoEvent.json_value.data).toEqual({
      media_posts: 0,
      direct_posts: 1,
      total: 1,
    });
    expect(+postTwoEvent.result_value).toBe(1);

    expect(postThreeEvent.json_value.data).toEqual({
      media_posts: 1,
      direct_posts: 0,
      total: 1,
    });
    expect(+postThreeEvent.result_value).toBe(1);
  });

  it('calculate post comments current amount', async () => {
    // First post has four comments - two direct and two comment on comment
    const postOneId = await PostsGenerator.createMediaPostByUserHimself(userVlad);
    const batchSize = 2;

    const [postOneCommentOneId] = await Promise.all([
      CommentsGenerator.createCommentForPostAndGetId(postOneId, userVlad),
      CommentsGenerator.createCommentForPostAndGetId(postOneId, userJane),
    ]);

    await Promise.all([
      CommentsGenerator.createCommentOnComment(postOneId, postOneCommentOneId, userPetr),
      CommentsGenerator.createCommentOnComment(postOneId, postOneCommentOneId, userRokky),
    ]);

    // Second post has only one comment - direct one
    const postTwoId = await PostsGenerator.createMediaPostByUserHimself(userJane);
    await CommentsGenerator.createCommentForPost(postTwoId, userPetr);

    // Third post has no comments.
    const postThreeId = await PostsGenerator.createMediaPostByUserHimself(userRokky);

    await EntityJobExecutorService.processEntityEventParam(batchSize);

    const postEvents: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithPostEntityName(
        EventParamTypeDictionary.getPostCommentsCurrentAmount(),
      );

    expect(_.isEmpty(postEvents)).toBeFalsy();

    expect(postEvents.length).toBe(2);

    const postOneEvent = postEvents.find(item => +item.entity_id === postOneId)!;
    const postTwoEvent = postEvents.find(item => +item.entity_id === postTwoId)!;
    expect(postEvents.some(item => +item.entity_id === postThreeId)).toBeFalsy();

    expect(postOneEvent.json_value.data).toEqual({ comments: 4 });
    expect(+postOneEvent.result_value).toBe(4);
    expect(postTwoEvent.json_value.data).toEqual({ comments: 1 });
    expect(+postTwoEvent.result_value).toBe(1);
  });

  it('calculate current post reposts amount to entity-event-params', async () => {
    const batchSize = 2;

    const postOneId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

    // Post one has two reposts
    await Promise.all([
      PostsGenerator.createRepostOfUserPost(userJane, postOneId),
      PostsGenerator.createRepostOfUserPost(userPetr, postOneId),
    ]);

    // Post two has one repost only
    const { postId: postTwoId } =
      await PostsGenerator.createUserPostAndRepost(userVlad, userJane);

    // Post three does not have any reposts
    const postThreeId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

    await EntityJobExecutorService.processEntityEventParam(batchSize);

    const postEvents: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithPostEntityName(
        EventParamTypeDictionary.getPostRepostsCurrentAmount(),
      );

    expect(_.isEmpty(postEvents)).toBeFalsy();

    expect(postEvents.length).toBe(2);

    const postOneEvent = postEvents.find(item => +item.entity_id === postOneId)!;
    const postTwoEvent = postEvents.find(item => +item.entity_id === postTwoId)!;
    expect(postEvents.some(item => +item.entity_id === postThreeId)).toBeFalsy();

    expect(postOneEvent.json_value.data).toEqual({
      reposts: 2,
    });
    expect(postTwoEvent.json_value.data).toEqual({
      reposts: 1,
    });
  });

  it('calculate upvotes/downvotes amount for posts', async () => {
    // TODO - also calculate one for organizations - some posts should be from orgs
    const batchSize = 2;
    const entitiesAmount = 4;
    // @ts-ignore
    const [postOneId, postTwoId, postThreeId, postFourId] =
      await PostsGenerator.createManyDefaultMediaPostsByUserHimself(userVlad, entitiesAmount);

    await Promise.all([
      // Three likes for first post
      PostsHelper.requestToUpvotePost(userJane, postOneId),
      PostsHelper.requestToUpvotePost(userPetr, postOneId),
      PostsHelper.requestToUpvotePost(userRokky, postOneId),
    ]);
    await Promise.all([
      // Two likes and one dislike for second post
      PostsHelper.requestToUpvotePost(userJane, postTwoId),
      PostsHelper.requestToUpvotePost(userPetr, postTwoId),
      PostsHelper.requestToDownvotePost(userRokky, postTwoId),
    ]);

    await Promise.all([
      // Three dislikes, no likes for third post
      PostsHelper.requestToDownvotePost(userJane, postThreeId),
      PostsHelper.requestToDownvotePost(userPetr, postThreeId),
      PostsHelper.requestToDownvotePost(userRokky, postThreeId),
    ]);

    await EntityJobExecutorService.processEntityEventParam(batchSize);

    const postEvents: EntityEventParamDto[] =
      await EntityEventRepository.findManyEventsWithPostEntityName(
        EventParamTypeDictionary.getPostVotesCurrentAmount(),
      );

    const postOneEvent = postEvents.find(item => +item.entity_id === postOneId)!;
    const postTwoEvent = postEvents.find(item => +item.entity_id === postTwoId)!;
    const postThreeEvent = postEvents.find(item => +item.entity_id === postThreeId)!;

    expect(postEvents.some(item => +item.entity_id === postFourId)).toBeFalsy();

    expect(postOneEvent.json_value.data).toEqual({
      upvotes: 3,
      downvotes: 0,
      total: 3,
    });
    expect(postTwoEvent.json_value.data).toEqual({
      upvotes: 2,
      downvotes: 1,
      total: 1,
    });
    expect(postThreeEvent.json_value.data).toEqual({
      upvotes: 0,
      downvotes: 3,
      total: -3,
    });
  }, JEST_TIMEOUT);
});

export {};
