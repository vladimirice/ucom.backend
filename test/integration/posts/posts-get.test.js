const request = require('supertest');
const server = require('../../../app');
const expect = require('expect');

const helpers = require('../helpers');
const gen     = require('../../generators');

const UsersHelper     = helpers.Users;
const SeedsHelper     = helpers.Seeds;
const PostHelper      = helpers.Posts;
const RequestHelper   = helpers.Req;
const ResponseHelper  = helpers.Res;

const { ContentTypeDictionary } = require('uos-app-transaction');

const PostsService = require('./../../../lib/posts/post-service');
const PostsRepository = require('./../../../lib/posts/posts-repository');
const PostOfferRepository = require('./../../../lib/posts/repository').PostOffer;

const postsUrl = helpers.Req.getPostsUrl();

const PostsGen = require('../../generators').Posts;

require('jest-expect-message');

let userVlad, userJane;

helpers.Mock.mockAllBlockchainPart();

describe('Posts API', () => {
  beforeAll(async () => {
    userVlad = await UsersHelper.getUserVlad();
    userJane = await UsersHelper.getUserJane();
  });

  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  describe('GET posts', () => {
    describe('Test filtering', () => {
      it('GET only media posts', async () => {
        let url = RequestHelper.getPostsUrl();
        url += `?post_type_id=${ContentTypeDictionary.getTypeMediaPost()}`;

        const res = await request(server)
          .get(url)
        ;

        ResponseHelper.expectStatusOk(res);
        const mediaPosts = res.body.data;

        const mediaPostsFromDb = await PostsRepository.findAllMediaPosts(true);

        expect(mediaPosts.length).toBe(mediaPostsFromDb.length);
      });

      it('GET only post-offers', async () => {
        let url = RequestHelper.getPostsUrl();
        url += `?post_type_id=${ContentTypeDictionary.getTypeOffer()}`;

        const res = await request(server)
          .get(url)
        ;

        ResponseHelper.expectStatusOk(res);
        const fromRequest = res.body.data;

        const fromDb = await PostOfferRepository.findAllPostOffers(true);

        expect(fromRequest.length).toBe(fromDb.length);
      });
    });
    describe('Test pagination', async () => {
      it('Fix bug about has more', async () => {
        const postsOwner = userVlad;
        const directPostAuthor = userJane;

        await PostsGen.generateUsersPostsForUserWall(postsOwner, directPostAuthor, 50);

        const queryString = 'page=2&post_type_id=1&sort_by=-current_rate&per_page=20';

        const response = await helpers.Posts.requestToGetManyPostsAsGuest(queryString, false);

        helpers.Res.checkMetadata(response, 2, 20, 54, true);

      }, 10000);

      it('Every request should contain correct metadata', async () => {
        const perPage = 2;
        let page = 1;

        const response = await PostHelper.requestAllPostsWithPagination(page, perPage);

        const metadata = response['metadata'];

        const totalAmount = await PostsRepository.countAllPosts();

        expect(metadata).toBeDefined();
        expect(metadata.has_more).toBeTruthy();
        expect(metadata.page).toBe(page);
        expect(metadata.per_page).toBe(perPage);
        expect(metadata.total_amount).toBe(totalAmount);

        const lastPage = totalAmount - perPage;

        const lastResponse = await PostHelper.requestAllPostsWithPagination(lastPage, perPage);

        expect(lastResponse.metadata.has_more).toBeFalsy();
      });

      it('Get two post pages', async () => {
        const perPage = 2;
        let page = 1;

        const posts = await PostsRepository.findAllPosts({
          'order': [
            ['current_rate', 'DESC'],
            ['id', 'DESC']
          ]
        });
        const firstPage = await PostHelper.requestAllPostsWithPagination(page, perPage, true);

        const expectedIdsOfFirstPage = [
          posts[page - 1].id,
          posts[page].id,
        ];

        expect(firstPage.length).toBe(perPage);

        firstPage.forEach((post, i) => {
          expect(post.id).toBe(expectedIdsOfFirstPage[i])
        });

        page = 2;
        const secondPage = await PostHelper.requestAllPostsWithPagination(page, perPage, true);

        const expectedIdsOfSecondPage = [
          posts[page].id,
          posts[page + 1].id,
        ];

        expect(secondPage.length).toBe(perPage);

        secondPage.forEach((post, i) => {
          expect(post.id).toBe(expectedIdsOfSecondPage[i])
        });

      });

      it('Page 0 and page 1 behavior must be the same', async () => {
        const perPage = 2;

        const pageIsZeroResponse = await PostHelper.requestAllPostsWithPagination(1, perPage, true);
        const pageIsOneResponse = await PostHelper.requestAllPostsWithPagination(1, perPage, true);

        expect(JSON.stringify(pageIsZeroResponse)).toBe(JSON.stringify(pageIsOneResponse));
      });
    });

    describe('Test sorting', async () => {
      it('Sort by rate_delta', async () => {
        const url = RequestHelper.getPostsUrl() + '?sort_by=-rate_delta';
        const res = await request(server)
          .get(url)
        ;

        ResponseHelper.expectStatusOk(res);

        // TODO
      });

      it('Sort by current_rate DESC', async () => {
        // title, comments_count, rate

        const url = RequestHelper.getPostsUrl() + '?sort_by=-current_rate,-id';

        const res = await request(server)
          .get(url)
        ;

        ResponseHelper.expectStatusOk(res);

        const minPostId = await PostsRepository.findMinPostIdByParameter('current_rate');
        const maxPostId = await PostsRepository.findMaxPostIdByParameter('current_rate');

        const posts = res.body.data;

        expect(posts[posts.length - 1].id).toBe(minPostId);
        expect(posts[0].id).toBe(maxPostId);
      });
      it('Sort by current_rate ASC', async () => {
        // title, comments_count, rate

        const url = RequestHelper.getPostsUrl() + '?sort_by=current_rate,-id';

        const res = await request(server)
          .get(url)
        ;

        ResponseHelper.expectStatusOk(res);

        const minPostId = await PostsRepository.findMinPostIdByParameter('current_rate');
        const maxPostId = await PostsRepository.findMaxPostIdByParameter('current_rate');

        const posts = res.body.data;

        expect(posts[posts.length - 1].id).toBe(maxPostId);
        expect(posts[0].id).toBe(minPostId);
      });

      it('Sort by title DESC', async () => {

        const url = RequestHelper.getPostsUrl() + '?sort_by=title,-id';

        const res = await request(server)
          .get(url)
        ;

        ResponseHelper.expectStatusOk(res);

        const minPostId = await PostsRepository.findMinPostIdByParameter('title');
        const maxPostId = await PostsRepository.findMaxPostIdByParameter('title');

        const posts = res.body.data;

        expect(posts[posts.length - 1].id).toBe(maxPostId);
        expect(posts[0].id).toBe(minPostId);
      });

      it('Sort by comments_count DESC', async () => {
        const postToComments = [
          {
            post_id: 3,
            comments_count: 200
          },
          {
            post_id: 1,
            comments_count: 150
          },
          {
            post_id: 4,
            comments_count: 100
          },
        ];

        const setComments = [];
        postToComments.forEach(data => {
          setComments.push(PostHelper.setCommentCountDirectly(data.post_id, data.comments_count));
        });
        await Promise.all(setComments);

        const posts = await PostHelper.requestToGetManyPostsAsGuest('sort_by=-comments_count');

        postToComments.forEach((data, index) => {
          expect(posts[index].id).toBe(data.post_id);
        });
      });

      it('Sort by comments_count ASC', async () => {
        const postToComments = [
          {
            post_id: 2,
            comments_count: 0,
          },
          {
            post_id: 5,
            comments_count: 10
          },
          {
            post_id: 4,
            comments_count: 100
          },
          {
            post_id: 1,
            comments_count: 150
          },

          {
            post_id: 3,
            comments_count: 200
          },
        ];

        const setComments = [];
        postToComments.forEach(data => {
          setComments.push(PostHelper.setCommentCountDirectly(data.post_id, data.comments_count));
        });
        await Promise.all(setComments);

        const posts = await PostHelper.requestToGetManyPostsAsGuest('sort_by=comments_count');

        postToComments.forEach((data, index) => {
          expect(posts[index].id).toBe(data.post_id);
        });
      });
    });

    it('All posts. Guest. No filters', async () => {
      const posts = await helpers.Posts.requestToGetManyPostsAsGuest();

      const postsFromDb = await PostsRepository.findAllPosts();

      const options = {
        'myselfData':     false,
        'postProcessing': 'list',
      };

      helpers.Common.checkPostsListFromApi(posts, postsFromDb.length, options);
    });

    it('All posts. Myself. No filters', async () => {
      const posts = await helpers.Posts.requestToGetManyPostsAsMyself(userVlad);
      const postsFromDb = await PostsRepository.findAllPosts();

      const options = {
        'myselfData':     true,
        'postProcessing': 'list',
      };

      helpers.Common.checkPostsListFromApi(posts, postsFromDb.length, options);
    });

    it('Must be 404 response if post id is not correct', async () => {
      const res = await request(server)
        .get(`${postsUrl}/100500`)
      ;

      ResponseHelper.expectStatusNotFound(res);
    });
  });

  describe('Myself data related to post properties', function () {
    describe('Posts lists', () => {
      it('should contain myself_vote upvote or downvote in all posts list', async () => {
        const myself = userVlad;

        const targetUserId = userJane.id;
        const janePostIdToUpvote = await PostsRepository.findFirstMediaPostIdUserId(targetUserId);
        const janePostIdToDownvote = await PostsRepository.findLastMediaPostIdUserId(targetUserId);

        await helpers.Posts.requestToUpvotePost(myself, janePostIdToUpvote);
        await helpers.Posts.requestToDownvotePost(myself, janePostIdToDownvote);

        const posts = await helpers.Posts.requestToGetManyPostsAsMyself(myself);

        const actualPostToUpvote = posts.find(data => data.id === janePostIdToUpvote);
        const actualPostToDownvote = posts.find(data => data.id === janePostIdToDownvote);

        expect(actualPostToUpvote.myselfData.myselfVote).toBe('upvote');
        expect(actualPostToDownvote.myselfData.myselfVote).toBe('downvote');
      });

      it('should contain myself_vote upvote or downvote in user posts list', async () => {
        const janePostIdToUpvote    = await PostsRepository.findFirstMediaPostIdUserId(userJane.id);
        const janePostIdToDownvote  = await PostsRepository.findLastMediaPostIdUserId(userJane.id);

        await helpers.Posts.requestToUpvotePost(userVlad, janePostIdToUpvote);
        await helpers.Posts.requestToDownvotePost(userVlad, janePostIdToDownvote);

        const posts = await helpers.Posts.requestToGetManyPostsAsMyself(userVlad);

        const actualPostToUpvote    = posts.find(data => data.id === janePostIdToUpvote);
        const actualPostToDownvote  = posts.find(data => data.id === janePostIdToDownvote);

        expect(actualPostToUpvote.myselfData.myselfVote).toBe('upvote');
        expect(actualPostToDownvote.myselfData.myselfVote).toBe('downvote');
      });

      it('should contain repost_available property for org wall', async () => {
        const parentPostAuthor = userVlad;
        const repostAuthor = userJane;
        const orgId = await gen.Org.createOrgWithoutTeam(parentPostAuthor);

        const [
          orgPostIdToRepost,
          secondOrgPostIdToRepost,
          orgPostIdNotToRepost,
          secondOrgPostIdNotToRepost
        ] = await Promise.all([
            gen.Posts.createMediaPostOfOrganization(parentPostAuthor, orgId),
            gen.Posts.createMediaPostOfOrganization(parentPostAuthor, orgId),
            gen.Posts.createMediaPostOfOrganization(parentPostAuthor, orgId),
            gen.Posts.createMediaPostOfOrganization(parentPostAuthor, orgId),
          ]);

        await Promise.all([
          gen.Posts.createRepostOfUserPost(repostAuthor, orgPostIdToRepost),
          gen.Posts.createRepostOfUserPost(repostAuthor, secondOrgPostIdToRepost)
        ]);

        const posts = await helpers.Org.requestToGetOrgWallFeedAsMyself(repostAuthor, orgId);

        posts.forEach(post => {
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
      });

      it('should contain repost_available property for user wall', async () => {
        const parentPostAuthor = userVlad;
        const repostAuthor = userJane;

        const [postIdToRepost, secondPostIdToRepost, postIdNotToRepost, secondPostIdNotToRepost] =
          await Promise.all([
            gen.Posts.createMediaPostByUserHimself(parentPostAuthor),
            gen.Posts.createMediaPostByUserHimself(parentPostAuthor),
            gen.Posts.createMediaPostByUserHimself(parentPostAuthor),
            gen.Posts.createMediaPostByUserHimself(parentPostAuthor),
        ]);

        await Promise.all([
          gen.Posts.createRepostOfUserPost(repostAuthor, postIdToRepost),
          gen.Posts.createRepostOfUserPost(repostAuthor, secondPostIdToRepost)
        ]);

        const posts = await helpers.Users.requestToGetWallFeedAsMyself(repostAuthor, parentPostAuthor);

        posts.forEach(post => {
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
      });
    });
  });

  it('List of post does not contain myself statuses', async () => {
    const postToUpvote = await PostsService.findLastMediaPostByAuthor(userJane.id);

    await helpers.PostHelper.requestToUpvotePost(userVlad, postToUpvote.id);

    const res = await request(server)
      .get(RequestHelper.getPostsUrl())
    ;

    ResponseHelper.expectStatusOk(res);

    res.body.data.forEach(post => {
      expect(post.title).toBeDefined();
      expect(post.myselfData).not.toBeDefined();
    });
  });

  describe('Get One post', () => {
    describe('Positive', () => {
      it('Get one post. Guest', async () => {
        // TODO check different post types
        const postId = 1; // media post

        const post = await helpers.Posts.requestToGetOnePostAsGuest(postId);

        const options = {
          'myselfData'    : false,
          'postProcessing': 'full',
        };

        helpers.Common.checkOnePostForPage(post, options);
      });

      it('Get one post. Myself', async () => {
        // TODO check different post types
        const postId = 1; // media post

        const post = await helpers.Posts.requestToGetOnePostAsMyself(postId, userVlad);

        const options = {
          'myselfData'    : true,
          'postProcessing': 'full',
        };

        helpers.Common.checkOnePostForPage(post, options);
      });
    });
  });

  it('User data inside post is normalized', async () => {
    await UsersHelper.setSampleRateToUser(userVlad);

    const post = await PostsService.findLastMediaPostByAuthor(userVlad.id);

    const res = await request(server)
      .get(`${RequestHelper.getPostsUrl()}/${post.id}`)
      .set('Authorization', `Bearer ${userVlad.token}`)
    ;

    ResponseHelper.expectStatusOk(res);
    const body = res.body;

    const author = body['User'];

    expect(author).toBeDefined();
    expect(parseInt(author.current_rate)).toBeGreaterThan(0);
  });
});
