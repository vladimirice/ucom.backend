const request = require('supertest');
const server = require('../../../app');
const expect = require('expect');
const fs = require('fs');

const UsersHelper = require('../helpers/users-helper');
const SeedsHelper = require('../helpers/seeds-helper');
const PostHelper = require('../helpers/posts-helper');
const ResponseHelper = require('../helpers/response-helper');

const PostsService = require('./../../../lib/posts/post-service');

const avatarPath = `${__dirname}/../../../seeders/images/ankr_network.png`;

const postsUrl = '/api/v1/posts';

const { avatarStoragePath } = require('../../../lib/users/avatar-upload-middleware');

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

    it('Get all posts', async () => {

      const res = await request(server)
        .get(postsUrl)
      ;

      expect(res.status).toBe(200);

      const body = res.body;

      const posts = await PostsService.findAll();
      expect(body.length).toBe(posts.length);

      expect(body[0].hasOwnProperty('User')).toBeTruthy();
    });

    it('Get one post', async () => {
      const posts = await PostsService.findAll();

      const firstPost = posts[0];

      const res = await request(server)
        .get(`${postsUrl}/${firstPost.id}`)
      ;

      ResponseHelper.expectStatusOk(res);
      PostHelper.validateResponseJson(res.body, firstPost);
    });

    it('Must be 404 response if post id is not correct', async () => {
      const res = await request(server)
        .get(`${postsUrl}/100500`)
      ;

      ResponseHelper.expectStatusNotFound(res);
    });
  });

  it('Create new post by form data', async () => {
    const userVlad = await UsersHelper.getUserVlad();

    const newPostFields = {
      'title': 'Extremely new post',
      'description': 'Our super post description',
      'leading_text': 'extremely leading text',
      'post_type_id': 1,
      'user_id': userVlad.id,
      'current_rate': 0.0000000000,
      'current_vote': 0,
    };

    const res = await request(server)
      .post(postsUrl)
      .set('Authorization', `Bearer ${userVlad.token}`)
      .field('title', newPostFields['title'])
      .field('description', newPostFields['description'])
      .field('post_type_id', newPostFields['post_type_id'])
      .field('leading_text', newPostFields['leading_text'])
      .attach('main_image_filename', avatarPath)
    ;

    ResponseHelper.expectStatusOk(res);

    const posts = await PostsService.findAllByAuthor(userVlad.id);
    const newPost = posts.find(data => data.title === newPostFields['title']);
    expect(newPost).toBeDefined();

    PostHelper.validateResponseJson(res.body, newPost);

    expect(fs.existsSync(`${avatarStoragePath}/${res.body.main_image_filename}`)).toBeTruthy();

    const avatarFetchRes = await request(server)
      .get(`/upload/${res.body.main_image_filename}`);

    expect(avatarFetchRes.status).toBe(200);
  });

  it('Update post by its author', async () => {
    const userVlad = await UsersHelper.getUserVlad();
    const vladPosts = await PostsService.findAllByAuthor(userVlad.id);

    const firstPostBefore = vladPosts[0];

    const fieldsToChange = {
      'title': 'This is title to change',
      'description': 'Also necessary to change description',
      'leading_text': 'And leading text',
    };

    const res = await request(server)
      .patch(`${postsUrl}/${firstPostBefore.id}`)
      .set('Authorization', `Bearer ${userVlad.token}`)
      .field('title',         fieldsToChange['title'])
      .field('description',   fieldsToChange['description'])
      .field('leading_text',  fieldsToChange['leading_text'])
      .attach('main_image_filename', avatarPath)
    ;

    ResponseHelper.expectStatusOk(res);

    const firstPostAfter = await PostsService.findOneByIdAndAuthor(firstPostBefore.id, userVlad.id, true);

    const body = res.body;

    PostHelper.validateResponseJson(body, firstPostAfter);

    // Check post is changed
    for (const field in fieldsToChange) {
      expect(firstPostBefore.hasOwnProperty(field)).toBeTruthy();
      expect(firstPostAfter.hasOwnProperty(field)).toBeTruthy();
      expect(body.hasOwnProperty(field)).toBeTruthy();

      expect(firstPostAfter[field]).not.toBe(firstPostBefore[field]);
      expect(firstPostAfter[field]).toBe(fieldsToChange[field]);
    }

    // Check image changing process
    expect(fs.existsSync(`${avatarStoragePath}/${res.body.main_image_filename}`)).toBeTruthy();
    expect(firstPostAfter.main_image_filename).not.toBe(firstPostBefore.main_image_filename);
    const avatarFetchRes = await request(server)
      .get(`/upload/${res.body.main_image_filename}`);
    expect(avatarFetchRes.status).toBe(200);
  });


  it('Not possible to update post by user who is not its author', async () => {
    const userVlad = await UsersHelper.getUserVlad();
    const userJane = await UsersHelper.getUserJane();

    const janePosts = await PostsService.findAllByAuthor(userJane.id);

    const firstPost = janePosts[0];

    const res = await request(server)
      .patch(`${postsUrl}/${firstPost.id}`)
      .set('Authorization', `Bearer ${userVlad.token}`)
      .field('title', 'Vlad title for Jane post')
    ;

    ResponseHelper.expectStatusNotFound(res);
  });

  it('It is not possible to create post without token', async () => {
    const res = await request(server)
      .post(postsUrl)
      .set('Authorization', `Bearer wrong token`)
    ;

    ResponseHelper.expectStatusUnauthorized(res);
  });
});
