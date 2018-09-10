const request = require('supertest');
const server = require('../../../app');
const expect = require('expect');

const UsersHelper = require('../helpers/users-helper');
const SeedsHelper = require('../helpers/seeds-helper');
const PostHelper = require('../helpers/posts-helper');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const PostTypeDictionary = require('../../../lib/posts/post-type-dictionary');

const PostsService = require('./../../../lib/posts/post-service');
const PostsRepository = require('./../../../lib/posts/posts-repository');
const PostOfferRepository = require('./../../../lib/posts/post-offer/post-offer-repository');

const postsUrl = '/api/v1/posts';

require('jest-expect-message');

let userVlad;

describe('Posts API', () => {
  beforeAll(async () => {
    userVlad = await UsersHelper.getUserVlad();
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

        const posts = await PostsRepository.findAllPosts(true);
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
        // TODO
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
    await UsersHelper.setSampleRateToUserVlad();

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
