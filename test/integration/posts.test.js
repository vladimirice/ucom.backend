const request = require('supertest');
const server = require('../../app');
const expect = require('expect');
const fs = require('fs');

const UsersHelper = require('./helpers/users-helper');
const SeedsHelper = require('./helpers/seeds-helper');
const PostHelper = require('./helpers/posts-helper');
const ResponseHelper = require('./helpers/response-helper');


const PostsRepository = require('./../../lib/posts/posts-repository');

const avatarPath = `${__dirname}/../../seeders/images/ankr_network.png`;

const postsUrl = '/api/v1/posts';

const { avatarStoragePath } = require('../../lib/users/avatar-upload-middleware');


describe('Posts API', () => {
  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  it('Get all posts', async () => {
    const res = await request(server)
      .get(postsUrl)
    ;

    expect(res.status).toBe(200);

    const posts = await PostsRepository.findAllPosts();
    expect(res.body.length).toBe(posts.length);
  });

  it('Get one post', async () => {
    const posts = await PostsRepository.findAllPosts();

    const firstPost = posts[0];

    const res = await request(server)
      .get(`${postsUrl}/${firstPost.id}`)
    ;

    ResponseHelper.expectStatusOk(res);
    PostHelper.validateResponseJson(res.body, firstPost);
  });


  it('Create new post by form data', async () => {
    const userVlad = await UsersHelper.getUserVlad();

    const newPostFields = {
      'title': 'Extremely new post',
      'description': 'Our super post description',
      'post_type_id': 1,
      'user_id': userVlad.id,
      'current_rate': 0,
      'current_vote': 0,
    };

    const res = await request(server)
      .post(postsUrl)
      .set('Authorization', `Bearer ${userVlad.token}`)
      .field('title', newPostFields['title'])
      .field('description', newPostFields['description'])
      .field('post_type_id', newPostFields['post_type_id'])
      .attach('main_image_filename', avatarPath)
    ;

    ResponseHelper.expectStatusOk(res);

    const posts = await PostsRepository.findAllPosts();
    const newPost = posts.find(data => data.title === newPostFields['title']);
    expect(newPost).toBeDefined();

    PostHelper.validateResponseJson(res.body, newPost);

    expect(fs.existsSync(`${avatarStoragePath}/${res.body.main_image_filename}`)).toBeTruthy();

    const avatarFetchRes = await request(server)
      .get(`/upload/${res.body.main_image_filename}`);

    expect(avatarFetchRes.status).toBe(200);
  });

  it('It is not possible to create post without token', async () => {
    const res = await request(server)
      .post(postsUrl)
      .set('Authorization', `Bearer wrong token`)
    ;

    ResponseHelper.expectStatusUnauthorized(res);
  });

  it('Must be 404 response if post id is not correct', async () => {
    const res = await request(server)
      .get(`${postsUrl}/100500`)
    ;

    ResponseHelper.expectStatusNotFound(res);
  });
});
