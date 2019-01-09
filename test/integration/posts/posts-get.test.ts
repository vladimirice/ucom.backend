export {};

const request = require('supertest');
const server = require('../../../app');
const expect = require('expect');

const helpers = require('../helpers');

const usersHelper     = helpers.Users;
const seedsHelper     = helpers.Seeds;
const postHelper      = helpers.Posts;
const requestHelper   = helpers.Req;
const responseHelper  = helpers.Res;

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

const postsService = require('./../../../lib/posts/post-service');
const postsRepository = require('./../../../lib/posts/posts-repository');
const postOfferRepository = require('./../../../lib/posts/repository').PostOffer;

const postsUrl = helpers.Req.getPostsUrl();

const postsGen = require('../../generators').Posts;

require('jest-expect-message');

let userVlad;
let userJane;

helpers.Mock.mockAllBlockchainPart();

describe('Posts API', () => {
  beforeAll(async () => {
    userVlad = await usersHelper.getUserVlad();
    userJane = await usersHelper.getUserJane();
  });

  beforeEach(async () => {
    await seedsHelper.initSeeds();
  });

  afterAll(async () => {
    await seedsHelper.sequelizeAfterAll();
  });

  describe('GET posts', () => {
    describe('Test filtering', () => {
      it('GET only media posts', async () => {
        let url = requestHelper.getPostsUrl();
        url += `?post_type_id=${ContentTypeDictionary.getTypeMediaPost()}`;

        const res = await request(server)
          .get(url)
        ;

        responseHelper.expectStatusOk(res);
        const mediaPosts = res.body.data;

        const mediaPostsFromDb = await postsRepository.findAllMediaPosts(true);

        expect(mediaPosts.length).toBe(mediaPostsFromDb.length);
      });

      it('GET only post-offers', async () => {
        let url = requestHelper.getPostsUrl();
        url += `?post_type_id=${ContentTypeDictionary.getTypeOffer()}`;

        const res = await request(server)
          .get(url)
        ;

        responseHelper.expectStatusOk(res);
        const fromRequest = res.body.data;

        const fromDb = await postOfferRepository.findAllPostOffers(true);

        expect(fromRequest.length).toBe(fromDb.length);
      });
    });

    describe('Test pagination', async () => {
      it('Fix bug about has more', async () => {
        const postsOwner = userVlad;
        const directPostAuthor = userJane;

        await postsGen.generateUsersPostsForUserWall(postsOwner, directPostAuthor, 50);

        const queryString = 'page=2&post_type_id=1&sort_by=-current_rate&per_page=20';

        const response = await helpers.Posts.requestToGetManyPostsAsGuest(queryString, false);

        helpers.Res.checkMetadata(response, 2, 20, 54, true);

      }, 10000);

      it('Every request should contain correct metadata', async () => {
        const perPage = 2;
        const page = 1;

        const response = await postHelper.requestAllPostsWithPagination(page, perPage);

        const metadata = response['metadata'];

        const totalAmount = await postsRepository.countAllPosts();

        expect(metadata).toBeDefined();
        expect(metadata.has_more).toBeTruthy();
        expect(metadata.page).toBe(page);
        expect(metadata.per_page).toBe(perPage);
        expect(metadata.total_amount).toBe(totalAmount);

        const lastPage = totalAmount - perPage;

        const lastResponse = await postHelper.requestAllPostsWithPagination(lastPage, perPage);

        expect(lastResponse.metadata.has_more).toBeFalsy();
      });

      it('Get two post pages', async () => {
        const perPage = 2;
        let page = 1;

        const posts = await postsRepository.findAllPosts({
          order: [
            ['current_rate', 'DESC'],
            ['id', 'DESC'],
          ],
        });
        const firstPage = await postHelper.requestAllPostsWithPagination(page, perPage, true);

        const expectedIdsOfFirstPage = [
          posts[page - 1].id,
          posts[page].id,
        ];

        expect(firstPage.length).toBe(perPage);

        firstPage.forEach((post, i) => {
          expect(post.id).toBe(expectedIdsOfFirstPage[i]);
        });

        page = 2;
        const secondPage = await postHelper.requestAllPostsWithPagination(page, perPage, true);

        const expectedIdsOfSecondPage = [
          posts[page].id,
          posts[page + 1].id,
        ];

        expect(secondPage.length).toBe(perPage);

        secondPage.forEach((post, i) => {
          expect(post.id).toBe(expectedIdsOfSecondPage[i]);
        });

      });

      it('Page 0 and page 1 behavior must be the same', async () => {
        const perPage = 2;

        const pageIsZeroResponse = await postHelper.requestAllPostsWithPagination(1, perPage, true);
        const pageIsOneResponse = await postHelper.requestAllPostsWithPagination(1, perPage, true);

        expect(JSON.stringify(pageIsZeroResponse)).toBe(JSON.stringify(pageIsOneResponse));
      });
    });

    describe('Test sorting', async () => {
      it('Smoke test. Nothing is found', async () => {
        const queryString = '?post_type_id=100500&created_at=24_hours&sort_by=-current_rate';
        const url = `${requestHelper.getPostsUrl()}${queryString}`;
        const res = await request(server)
          .get(url)
        ;

        responseHelper.expectStatusOk(res);

        expect(res.body.data.length).toBe(0);
      });

      it('Smoke test. Sort by current rate but only daily', async () => {
        const queryString = '?post_type_id=1&created_at=24_hours&sort_by=-current_rate';
        const url = `${requestHelper.getPostsUrl()}${queryString}`;
        const res = await request(server)
          .get(url)
        ;

        responseHelper.expectStatusOk(res);
      });

      it('sort by current_rate_daily_delta - smoke test', async () => {
        const url = `${requestHelper.getPostsUrl()}?sort_by=-current_rate_delta_daily`;
        const res = await request(server)
          .get(url)
        ;

        responseHelper.expectStatusOk(res);

        // TODO
      });

      it('Sort by current_rate DESC', async () => {
        const url = `${requestHelper.getPostsUrl()}?sort_by=-current_rate,-id`;

        const res = await request(server)
          .get(url)
        ;

        responseHelper.expectStatusOk(res);

        const minPostId = await postsRepository.findMinPostIdByParameter('current_rate');
        const maxPostId = await postsRepository.findMaxPostIdByParameter('current_rate');

        const posts = res.body.data;

        expect(posts[posts.length - 1].id).toBe(minPostId);
        expect(posts[0].id).toBe(maxPostId);
      });
      it('Sort by current_rate ASC', async () => {
        const url = `${requestHelper.getPostsUrl()}?sort_by=current_rate,-id`;

        const res = await request(server)
          .get(url)
        ;

        responseHelper.expectStatusOk(res);

        const minPostId = await postsRepository.findMinPostIdByParameter('current_rate');
        const maxPostId = await postsRepository.findMaxPostIdByParameter('current_rate');

        const posts = res.body.data;

        expect(posts[posts.length - 1].id).toBe(maxPostId);
        expect(posts[0].id).toBe(minPostId);
      });

      it('Sort by title DESC', async () => {
        const url = `${requestHelper.getPostsUrl()}?sort_by=title,-id`;

        const res = await request(server)
          .get(url)
        ;

        responseHelper.expectStatusOk(res);

        const minPostId = await postsRepository.findMinPostIdByParameter('title');
        const maxPostId = await postsRepository.findMaxPostIdByParameter('title');

        const posts = res.body.data;

        expect(posts[posts.length - 1].id).toBe(maxPostId);
        expect(posts[0].id).toBe(minPostId);
      });

      it('Sort by comments_count DESC', async () => {
        const postToComments = [
          {
            post_id: 3,
            comments_count: 200,
          },
          {
            post_id: 1,
            comments_count: 150,
          },
          {
            post_id: 4,
            comments_count: 100,
          },
        ];

        const setComments: any = [];
        postToComments.forEach((data) => {
          setComments.push(
            postHelper.setCommentCountDirectly(data.post_id, data.comments_count),
          );
        });
        await Promise.all(setComments);

        const posts = await postHelper.requestToGetManyPostsAsGuest('sort_by=-comments_count');

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
            comments_count: 10,
          },
          {
            post_id: 4,
            comments_count: 100,
          },
          {
            post_id: 1,
            comments_count: 150,
          },

          {
            post_id: 3,
            comments_count: 200,
          },
        ];

        const setComments: any = [];
        postToComments.forEach((data) => {
          setComments.push(
            postHelper.setCommentCountDirectly(data.post_id, data.comments_count),
          );
        });
        await Promise.all(setComments);

        const posts = await postHelper.requestToGetManyPostsAsGuest('sort_by=comments_count');

        postToComments.forEach((data, index) => {
          expect(posts[index].id).toBe(data.post_id);
        });
      });
    });

    it('All posts. Guest. No filters', async () => {
      const posts = await helpers.Posts.requestToGetManyPostsAsGuest();

      const postsFromDb = await postsRepository.findAllPosts();

      const options = {
        myselfData:     false,
        postProcessing: 'list',
      };

      helpers.Common.checkPostsListFromApi(posts, postsFromDb.length, options);
    });

    it('All posts. Myself. No filters', async () => {
      const posts = await helpers.Posts.requestToGetManyPostsAsMyself(userVlad);
      const postsFromDb = await postsRepository.findAllPosts();

      const options = {
        myselfData:     true,
        postProcessing: 'list',
      };

      helpers.Common.checkPostsListFromApi(posts, postsFromDb.length, options);
    });

    it('Must be 404 response if post id is not correct', async () => {
      const res = await request(server)
        .get(`${postsUrl}/100500`)
      ;

      responseHelper.expectStatusNotFound(res);
    });
  });

  it('List of post does not contain myself statuses', async () => {
    const postToUpvote = await postsService.findLastMediaPostByAuthor(userJane.id);

    await helpers.PostHelper.requestToUpvotePost(userVlad, postToUpvote.id);

    const res = await request(server)
      .get(requestHelper.getPostsUrl())
    ;

    responseHelper.expectStatusOk(res);

    res.body.data.forEach((post) => {
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
          myselfData    : false,
          postProcessing: 'full',
        };

        helpers.Common.checkOnePostForPage(post, options);
      });

      it('Get one post. Myself', async () => {
        // TODO check different post types
        const postId = 1; // media post

        const post = await helpers.Posts.requestToGetOnePostAsMyself(postId, userVlad);

        const options = {
          myselfData    : true,
          postProcessing: 'full',
        };

        helpers.Common.checkOnePostForPage(post, options);
      });
    });
  });

  it('User data inside post is normalized', async () => {
    await usersHelper.setSampleRateToUser(userVlad);

    const post = await postsService.findLastMediaPostByAuthor(userVlad.id);

    const res = await request(server)
      .get(`${requestHelper.getPostsUrl()}/${post.id}`)
      .set('Authorization', `Bearer ${userVlad.token}`)
    ;

    responseHelper.expectStatusOk(res);
    const body = res.body;

    const author = body['User'];

    expect(author).toBeDefined();
    expect(+author.current_rate).toBeGreaterThan(0);
  });
});
