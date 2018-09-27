const request = require('supertest');
const server = require('../../../app');
const expect = require('expect');

const helpers = require('../helpers');

const UsersHelper = require('../helpers/users-helper');
const SeedsHelper = require('../helpers/seeds-helper');
const PostHelper = require('../helpers/posts-helper');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const PostTypeDictionary = require('../../../lib/posts/post-type-dictionary');

const PostsService = require('./../../../lib/posts/post-service');
const PostsRepository = require('./../../../lib/posts/posts-repository');
const PostOfferRepository = require('./../../../lib/posts/repository').PostOffer;

const postsUrl = '/api/v1/posts';

require('jest-expect-message');

let userVlad;
let userJane;

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


  describe('GET posts', () => {
    describe('Test filtering', () => {
      it('GET only media posts', async () => {
        let url = RequestHelper.getPostsUrl();
        url += `?post_type_id=${PostTypeDictionary.getTypeMediaPost()}`;

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
        url += `?post_type_id=${PostTypeDictionary.getTypeOffer()}`;

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

        const posts = await PostsRepository.findAllPosts(true, {
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

        const posts = await PostHelper.requestToGetPostsAsGuest('sort_by=-comments_count');

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

        const posts = await PostHelper.requestToGetPostsAsGuest('sort_by=comments_count');

        postToComments.forEach((data, index) => {
          expect(posts[index].id).toBe(data.post_id);
        });
      });
    });

    it('Get all posts', async () => {

      const res = await request(server)
        .get(RequestHelper.getPostsUrl())
      ;

      ResponseHelper.expectStatusOk(res);
      const body = res.body.data;

      const posts = await PostsRepository.findAllPosts();
      expect(body.length).toBe(posts.length);

      expect(body[0].hasOwnProperty('User')).toBeTruthy();

      let postFields = PostsRepository.getModel().getFieldsForPreview();

      postFields.push('activity_user_posts');
      postFields.push('post_stats');
      postFields.push('post_users_team');
      postFields.push('User');

      UsersHelper.checkIncludedUserPreviewForArray(body);

      ResponseHelper.expectAllFieldsExistenceForArray(body, postFields);
    });

    it('Get one post', async () => {
      const post = await PostsService.findLastMediaPost();

      const res = await request(server)
        .get(`${postsUrl}/${post.id}`)
      ;

      ResponseHelper.expectStatusOk(res);
      PostHelper.validateResponseJson(res.body, post);

      expect(res.body['myselfData']).not.toBeDefined();
    });

    it('Must be 404 response if post id is not correct', async () => {
      const res = await request(server)
        .get(`${postsUrl}/100500`)
      ;

      ResponseHelper.expectStatusNotFound(res);
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
