const orgHelper   = require('../../helpers/organizations-helper');
const usersHelper = require('../../helpers/users-helper');
const seedsHelper = require('../../helpers/seeds-helper');
const mockHelper  = require('../../helpers/mock-helper');
const postsHelper = require('../../helpers/posts-helper');

const postsGenerator  = require('../../../generators/posts-generator');
const orgGenerator    = require('../../../generators/organizations-generator');

let userVlad;
let userJane;

const JEST_TIMEOUT = 10000;

describe('Posts myself data', () => {
  beforeAll(async () => {
    mockHelper.mockAllTransactionSigning();
    mockHelper.mockAllBlockchainJobProducers();
  });
  afterAll(async () => {
    await seedsHelper.doAfterAll();
  });
  beforeEach(async () => {
    [userVlad, userJane] = await seedsHelper.beforeAllRoutine();
  });

  describe('Posts lists', () => {
    describe('Voting', () => {
      it('should contain myself_vote upvote or downvote in all posts list', async () => {
        const myself = userVlad;

        const [janePostIdToUpvote, janePostIdToDownvote] =
          await postsGenerator.createManyDefaultMediaPostsByUserHimself(userJane, 2);

        await postsHelper.requestToUpvotePost(myself, janePostIdToUpvote);
        await postsHelper.requestToDownvotePost(myself, janePostIdToDownvote);

        const posts = await postsHelper.requestToGetManyPostsAsMyself(myself);

        const actualPostToUpvote = posts.find(data => data.id === janePostIdToUpvote);
        const actualPostToDownvote = posts.find(data => data.id === janePostIdToDownvote);

        expect(actualPostToUpvote.myselfData.myselfVote).toBe('upvote');
        expect(actualPostToDownvote.myselfData.myselfVote).toBe('downvote');
      }, JEST_TIMEOUT);
      it('should contain myself_vote upvote or downvote in user posts list', async () => {
        const [janePostIdToUpvote, janePostIdToDownvote] =
          await postsGenerator.createManyDefaultMediaPostsByUserHimself(userJane, 2);

        await postsHelper.requestToUpvotePost(userVlad, janePostIdToUpvote);
        await postsHelper.requestToDownvotePost(userVlad, janePostIdToDownvote);

        const posts = await postsHelper.requestToGetManyPostsAsMyself(userVlad);

        const actualPostToUpvote    = posts.find(data => data.id === janePostIdToUpvote);
        const actualPostToDownvote  = posts.find(data => data.id === janePostIdToDownvote);

        expect(actualPostToUpvote.myselfData.myselfVote).toBe('upvote');
        expect(actualPostToDownvote.myselfData.myselfVote).toBe('downvote');
      }, JEST_TIMEOUT);
    });

    describe('repost available', () => {
      it('should contain repost_available property for org wall', async () => {
        const parentPostAuthor = userVlad;
        const repostAuthor = userJane;
        const orgId = await orgGenerator.createOrgWithoutTeam(parentPostAuthor);

        const [
          orgPostIdToRepost,
          secondOrgPostIdToRepost,
          orgPostIdNotToRepost,
          secondOrgPostIdNotToRepost,
        ] = await postsGenerator.createManyMediaPostsOfOrganization(parentPostAuthor, orgId, 4);

        await Promise.all([
          postsGenerator.createRepostOfUserPost(repostAuthor, orgPostIdToRepost),
          postsGenerator.createRepostOfUserPost(repostAuthor, secondOrgPostIdToRepost),
        ]);

        const posts = await orgHelper.requestToGetOrgWallFeedAsMyself(repostAuthor, orgId);

        posts.forEach((post) => {
          expect(post.myselfData.repost_available).toBeDefined();
        });

        const repostedPost = posts.find(post => post.id === orgPostIdToRepost);
        expect(repostedPost).toBeDefined();
        expect(repostedPost.myselfData.repost_available).toBeFalsy();

        const secondRepostedPost = posts.find(post => post.id === secondOrgPostIdToRepost);
        expect(secondRepostedPost).toBeDefined();
        expect(secondRepostedPost.myselfData.repost_available).toBeFalsy();

        const notRepostedPost = posts.find(post => post.id === orgPostIdNotToRepost);
        expect(notRepostedPost).toBeDefined();
        expect(notRepostedPost.myselfData.repost_available).toBeTruthy();

        const secondNotRepostedPost = posts.find(post => post.id === secondOrgPostIdNotToRepost);
        expect(secondNotRepostedPost).toBeDefined();
        expect(secondNotRepostedPost.myselfData.repost_available).toBeTruthy();
      }, JEST_TIMEOUT);
      it('should contain repost_available property for user wall', async () => {
        const parentPostAuthor = userVlad;
        const repostAuthor = userJane;

        const [postIdToRepost, secondPostIdToRepost, postIdNotToRepost, secondPostIdNotToRepost] =
          await postsGenerator.createManyDefaultMediaPostsByUserHimself(parentPostAuthor, 4);

        await Promise.all([
          postsGenerator.createRepostOfUserPost(repostAuthor, postIdToRepost),
          postsGenerator.createRepostOfUserPost(repostAuthor, secondPostIdToRepost),
        ]);

        const posts =
          await usersHelper.requestToGetWallFeedAsMyself(repostAuthor, parentPostAuthor);

        posts.forEach((post) => {
          expect(post.myselfData.repost_available).toBeDefined();
        });

        const repostedPost = posts.find(post => post.id === postIdToRepost);
        expect(repostedPost).toBeDefined();
        expect(repostedPost.myselfData.repost_available).toBeFalsy();

        const secondRepostedPost = posts.find(post => post.id === secondPostIdToRepost);
        expect(secondRepostedPost).toBeDefined();
        expect(secondRepostedPost.myselfData.repost_available).toBeFalsy();

        const notRepostedPost = posts.find(post => post.id === postIdNotToRepost);
        expect(notRepostedPost).toBeDefined();
        expect(notRepostedPost.myselfData.repost_available).toBeTruthy();

        const secondNotRepostedPost = posts.find(post => post.id === secondPostIdNotToRepost);
        expect(secondNotRepostedPost).toBeDefined();
        expect(secondNotRepostedPost.myselfData.repost_available).toBeTruthy();
      }, JEST_TIMEOUT);

      describe('repost_available=false', () => {
        it('repost_available=false for post-repost', async () => {
          const parentPostAuthor = userVlad;
          const repostAuthor = userJane;
          const { repostId } = await postsGenerator.createUserPostAndRepost(userVlad, userJane);

          const posts =
           await usersHelper.requestToGetWallFeedAsMyself(parentPostAuthor, repostAuthor);

          const repost = posts.find(item => item.id === repostId);

          expect(typeof repost.myselfData.repost_available).toBe('boolean');
          expect(repost.myselfData.repost_available).toBeFalsy();
        });

        it('repost_available=false - user direct post by user himself', async () => {
          const myself = userVlad;
          const directPostAuthor = userJane;
          const directPost =
            await postsGenerator.createUserDirectPostForOtherUser(directPostAuthor, myself);

          const posts =
           await usersHelper.requestToGetWallFeedAsMyself(myself, myself);

          const repost = posts.find(item => item.id === directPost.id);

          expect(typeof repost.myselfData.repost_available).toBe('boolean');
          expect(repost.myselfData.repost_available).toBeFalsy();
        });

        it('repost_available=false - your own post', async () => {
          const myself = userVlad;
          const postId =
            await postsGenerator.createMediaPostByUserHimself(myself);

          const posts =
           await usersHelper.requestToGetWallFeedAsMyself(myself, myself);

          const repost = posts.find(item => item.id === postId);

          expect(typeof repost.myselfData.repost_available).toBe('boolean');
          expect(repost.myselfData.repost_available).toBeFalsy();
        });

        it('repost_available=false if post is already reposted', async () => {
          const postAuthor    = userJane;
          const repostAuthor  = userVlad;

          const { postId } =
            await postsGenerator.createUserPostAndRepost(postAuthor, repostAuthor);

          const posts =
           await usersHelper.requestToGetWallFeedAsMyself(repostAuthor, postAuthor);

          const repost = posts.find(item => item.id === postId);

          expect(typeof repost.myselfData.repost_available).toBe('boolean');
          expect(repost.myselfData.repost_available).toBeFalsy();
        });
      });
    });
  });
});

export {};
