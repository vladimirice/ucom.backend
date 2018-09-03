const request = require('supertest');
const server = require('../../../app');
const expect = require('expect');

const UsersHelper = require('../helpers/users-helper');
const SeedsHelper = require('../helpers/seeds-helper');
const PostHelper = require('../helpers/posts-helper');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');

const PostsService = require('./../../../lib/posts/post-service');
const FileToUploadHelper = require('../helpers/file-to-upload-helper');
const PostsRepository = require('./../../../lib/posts/posts-repository');

const avatarPath = `${__dirname}/../../../seeders/images/ankr_network.png`;

const postsUrl = '/api/v1/posts';


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

      const posts = await PostsRepository.findAllPosts();
      expect(body.length).toBe(posts.length);

      expect(body[0].hasOwnProperty('User')).toBeTruthy();
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

    const posts = await PostsRepository.findAllByAuthor(userVlad.id);
    const newPost = posts.find(data => data.title === newPostFields['title']);
    expect(newPost).toBeDefined();

    const body = res.body;

    expect(body.id).toBe(newPost.id);

    await FileToUploadHelper.isFileUploaded(newPost.main_image_filename);
  });

  it('Update post by its author', async () => {
    const userVlad = await UsersHelper.getUserVlad();
    const vladPosts = await PostsRepository.findAllByAuthor(userVlad.id);

    const firstPostBefore = vladPosts[0];

    expect(firstPostBefore.main_image_filename).toBeNull();

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

    const postAfter = await PostsService.findOneByIdAndAuthor(firstPostBefore.id, userVlad.id);

    PostHelper.validatePatchResponse(res, postAfter);

    ResponseHelper.expectValuesAreChanged(fieldsToChange, postAfter);

    expect(postAfter.main_image_filename).toBeDefined();
    await FileToUploadHelper.isFileUploaded(postAfter.main_image_filename);
  });


  it('Not possible to update post by user who is not its author', async () => {
    const userVlad = await UsersHelper.getUserVlad();
    const userJane = await UsersHelper.getUserJane();

    const janePosts = await PostsRepository.findAllByAuthor(userJane.id);

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
    ;

    ResponseHelper.expectStatusUnauthorized(res);
  });
});
