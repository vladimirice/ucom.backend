import RequestHelper = require('../helpers/request-helper');
import MockHelper = require('../helpers/mock-helper');
import UsersHelper = require('../helpers/users-helper');
import SeedsHelper = require('../helpers/seeds-helper');
import ResponseHelper = require('../helpers/response-helper');
import PostsGenerator = require('../../generators/posts-generator');
import PostsHelper = require('../helpers/posts-helper');
import CommonHelper = require('../helpers/common-helper');


const request = require('supertest');
const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

const server = require('../../../app');

const postsService = require('./../../../lib/posts/post-service');
const postsRepository = require('./../../../lib/posts/posts-repository');
const postOfferRepository = require('./../../../lib/posts/repository').PostOffer;

const postsUrl = RequestHelper.getPostsUrl();

require('jest-expect-message');

let userVlad;
let userJane;

MockHelper.mockAllBlockchainPart();

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

        const mediaPostsFromDb = await postsRepository.findAllMediaPosts(true);

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

        const fromDb = await postOfferRepository.findAllPostOffers(true);

        expect(fromRequest.length).toBe(fromDb.length);
      });
    });

    describe('Test pagination', () => {
      it('Fix bug about has more', async () => {
        const postsOwner = userVlad;
        const directPostAuthor = userJane;

        await PostsGenerator.generateUsersPostsForUserWall(postsOwner, directPostAuthor, 50);

        const queryString = 'page=2&post_type_id=1&sort_by=-current_rate&per_page=20';

        const response = await PostsHelper.requestToGetManyPostsAsGuest(queryString, false);

        ResponseHelper.checkMetadataByValues(response, 2, 20, 54, true);
      }, 10000);

      it('Every request should contain correct metadata', async () => {
        const perPage = 2;
        const page = 1;

        const response = await PostsHelper.requestAllPostsWithPagination(page, perPage);

        const { metadata } = response;

        const totalAmount = await postsRepository.countAllPosts();

        expect(metadata).toBeDefined();
        expect(metadata.has_more).toBeTruthy();
        expect(metadata.page).toBe(page);
        expect(metadata.per_page).toBe(perPage);
        expect(metadata.total_amount).toBe(totalAmount);

        const lastPage = totalAmount - perPage;

        const lastResponse = await PostsHelper.requestAllPostsWithPagination(lastPage, perPage);

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
        const firstPage = await PostsHelper.requestAllPostsWithPagination(page, perPage, true);

        const expectedIdsOfFirstPage = [
          posts[page - 1].id,
          posts[page].id,
        ];

        expect(firstPage.length).toBe(perPage);

        firstPage.forEach((post, i) => {
          expect(post.id).toBe(expectedIdsOfFirstPage[i]);
        });

        page = 2;
        const secondPage = await PostsHelper.requestAllPostsWithPagination(page, perPage, true);

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

        const pageIsZeroResponse =
          await PostsHelper.requestAllPostsWithPagination(1, perPage, true);
        const pageIsOneResponse = await PostsHelper.requestAllPostsWithPagination(1, perPage, true);

        expect(JSON.stringify(pageIsZeroResponse)).toBe(JSON.stringify(pageIsOneResponse));
      });
    });

    describe('Test sorting', () => {
      it('Smoke test. Nothing is found', async () => {
        const queryString = '?post_type_id=100500&created_at=24_hours&sort_by=-current_rate';
        const url = `${RequestHelper.getPostsUrl()}${queryString}`;
        const res = await request(server)
          .get(url)
        ;

        ResponseHelper.expectStatusOk(res);

        expect(res.body.data.length).toBe(0);
      });

      it('Smoke test. Sort by current rate but only daily', async () => {
        const queryString = '?post_type_id=1&created_at=24_hours&sort_by=-current_rate';
        const url = `${RequestHelper.getPostsUrl()}${queryString}`;
        const res = await request(server)
          .get(url)
        ;

        ResponseHelper.expectStatusOk(res);
      });

      it('sort by current_rate_daily_delta - smoke test', async () => {
        const url = `${RequestHelper.getPostsUrl()}?sort_by=-current_rate_delta_daily`;
        const res = await request(server)
          .get(url)
        ;

        ResponseHelper.expectStatusOk(res);
      });

      it('Sort by current_rate DESC', async () => {
        const url = `${RequestHelper.getPostsUrl()}?sort_by=-current_rate,-id`;

        const res = await request(server)
          .get(url)
        ;

        ResponseHelper.expectStatusOk(res);

        const minPostId = await postsRepository.findMinPostIdByParameter('current_rate');
        const maxPostId = await postsRepository.findMaxPostIdByParameter('current_rate');

        const posts = res.body.data;

        expect(posts[posts.length - 1].id).toBe(minPostId);
        expect(posts[0].id).toBe(maxPostId);
      });
      it('Sort by current_rate ASC', async () => {
        const url = `${RequestHelper.getPostsUrl()}?sort_by=current_rate,-id`;

        const res = await request(server)
          .get(url)
        ;

        ResponseHelper.expectStatusOk(res);

        const minPostId = await postsRepository.findMinPostIdByParameter('current_rate');
        const maxPostId = await postsRepository.findMaxPostIdByParameter('current_rate');

        const posts = res.body.data;

        expect(posts[posts.length - 1].id).toBe(maxPostId);
        expect(posts[0].id).toBe(minPostId);
      });

      it('Sort by title DESC', async () => {
        const url = `${RequestHelper.getPostsUrl()}?sort_by=title,-id`;

        const res = await request(server)
          .get(url)
        ;

        ResponseHelper.expectStatusOk(res);

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
            PostsHelper.setCommentCountDirectly(data.post_id, data.comments_count),
          );
        });
        await Promise.all(setComments);

        const posts = await PostsHelper.requestToGetManyPostsAsGuest('sort_by=-comments_count');

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
        // eslint-disable-next-line sonarjs/no-identical-functions
        postToComments.forEach((data) => {
          setComments.push(
            PostsHelper.setCommentCountDirectly(data.post_id, data.comments_count),
          );
        });
        await Promise.all(setComments);

        const posts = await PostsHelper.requestToGetManyPostsAsGuest('sort_by=comments_count');

        postToComments.forEach((data, index) => {
          expect(posts[index].id).toBe(data.post_id);
        });
      });
    });

    it('All posts. Guest. No filters', async () => {
      const posts = await PostsHelper.requestToGetManyPostsAsGuest();

      const postsFromDb = await postsRepository.findAllPosts();

      const options = {
        myselfData:     false,
        postProcessing: 'list',
      };

      CommonHelper.checkPostsListFromApi(posts, postsFromDb.length, options);
    });

    it('All posts. Myself. No filters', async () => {
      const posts = await PostsHelper.requestToGetManyPostsAsMyself(userVlad);
      const postsFromDb = await postsRepository.findAllPosts();

      const options = {
        myselfData:     true,
        postProcessing: 'list',
      };

      CommonHelper.checkPostsListFromApi(posts, postsFromDb.length, options);
    });

    it('Must be 404 response if post id is not correct', async () => {
      const res = await request(server)
        .get(`${postsUrl}/100500`)
      ;

      ResponseHelper.expectStatusNotFound(res);
    });
  });

  it('List of post does not contain myself statuses', async () => {
    const postToUpvote = await postsService.findLastMediaPostByAuthor(userJane.id);

    await PostsHelper.requestToUpvotePost(userVlad, postToUpvote.id);

    const res = await request(server)
      .get(RequestHelper.getPostsUrl())
    ;
    ResponseHelper.expectStatusOk(res);

    res.body.data.forEach((post) => {
      expect(post.title).toBeDefined();
      expect(post.myselfData).not.toBeDefined();
    });
  });

  describe('Get One post', () => {
    describe('Positive', () => {
      it('Get one post. Guest', async () => {
        // #task check different post types
        const postId = 1; // media post

        const post = await PostsHelper.requestToGetOnePostAsGuest(postId);

        const options = {
          myselfData    : false,
          postProcessing: 'full',
          commentsV1: true, // legacy
        };

        CommonHelper.checkOnePostForPage(post, options);
      });

      it('Get one post. Myself', async () => {
        // #task check different post types
        const postId = 1; // media post

        const post = await PostsHelper.requestToGetOnePostAsMyself(postId, userVlad);

        const options = {
          myselfData    : true,
          postProcessing: 'full',
          commentsV1: true, // legacy
        };

        CommonHelper.checkOnePostForPage(post, options);
      });
    });
  });

  it('User data inside post is normalized', async () => {
    await UsersHelper.setSampleRateToUser(userVlad);

    const post = await postsService.findLastMediaPostByAuthor(userVlad.id);

    const res = await request(server)
      .get(`${RequestHelper.getPostsUrl()}/${post.id}`)
      .set('Authorization', `Bearer ${userVlad.token}`)
    ;

    ResponseHelper.expectStatusOk(res);
    const { body } = res;

    const author = body.User;

    expect(author).toBeDefined();
    expect(+author.current_rate).toBeGreaterThan(0);
  });
});

export {};
