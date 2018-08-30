const request = require('supertest');
const server = require('../../../../app');
const expect = require('expect');

const UsersHelper = require('../../helpers/users-helper');
const SeedsHelper = require('../../helpers/seeds-helper');
const PostHelper = require('../../helpers/posts-helper');
const RequestHelper = require('../../helpers/request-helper');
const ResponseHelper = require('../../helpers/response-helper');
const FileToUploadHelper = require('../../helpers/file-to-upload-helper');
const PostTypeDictionary = require('../../../../lib/posts/post-type-dictionary');

const PostsService = require('./../../../../lib/posts/post-service');

const avatarPath = `${__dirname}/../../../../seeders/images/ankr_network.png`;

const postOfferUrl = '/api/v1/posts/offers';
const rootUrl = RequestHelper.getPostsUrl();

let userVlad;

describe('Posts API', () => {
  beforeAll(async () => {
    userVlad = await UsersHelper.getUserVlad();
  });

  beforeEach(async () => {
    await SeedsHelper.initPostOfferSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  it('Update post-offer by its author', async () => {
    const userVlad = await UsersHelper.getUserVlad();
    const firstPostBefore = await PostsService.findLastPostOfferByAuthor(userVlad.id);

    const fieldsToChange = {
      'leading_text': 'And leading text',
      'action_button_title': 'FOOBAR',
    };

    const res = await request(server)
      .patch(`${rootUrl}/${firstPostBefore.id}`)
      .set('Authorization', `Bearer ${userVlad.token}`)
      .field('leading_text',  fieldsToChange['leading_text'])
      .field('action_button_title',  fieldsToChange['action_button_title'])
    ;

    ResponseHelper.expectStatusOk(res);

    const firstPostAfter = await PostsService.findOneById(firstPostBefore.id);

    ResponseHelper.expectValuesAreChanged(fieldsToChange, firstPostAfter);
  });

  it('Get one post', async () => {
    const post = await PostsService.findLastPostOffer(userVlad.id);

    const res = await request(server)
      .get(`/api/v1/posts/${post.id}`)
    ;

    ResponseHelper.expectStatusOk(res);

    expect(res.body['action_button_title']).toBeDefined();
    expect(res.body['post_offer']).not.toBeDefined();

    // TODO
    // PostHelper.validateResponseJson(res.body, post);
  });

  it('Create new post-offer', async() => {
    let newPostFields = {
      'title': 'Extremely new post',
      'description': 'Our super post description',
      'leading_text': 'extremely leading text',
      'user_id': userVlad.id,
      'current_rate': '0.0000000000',
      'current_vote': 0,
    };

    let newPostOfferFields = {
      'action_button_title': 'JOIN',
      'action_button_url': 'https://example.com',
      'action_duration_in_days': 10,
    };

    const res = await request(server)
      .post(postOfferUrl)
      .set('Authorization', `Bearer ${userVlad.token}`)
      .field('title', newPostFields['title'])
      .field('description', newPostFields['description'])
      .field('leading_text', newPostFields['leading_text'])
      .field('action_button_title', newPostOfferFields['action_button_title'])
      .field('action_button_url', newPostOfferFields['action_button_url'])
      .field('action_duration_in_days', newPostOfferFields['action_duration_in_days'])
      .attach('main_image_filename', avatarPath)
    ;

    ResponseHelper.expectStatusOk(res);

    const lastPost = await PostsService.findLastPostOfferByAuthor(userVlad.id);

    expect(lastPost).toBeDefined();
    expect(lastPost['post_offer']).not.toBeNull();
    expect(res.body.post_id).toBeDefined();
    expect(res.body.post_id).toBe(lastPost.id);


    newPostFields['id'] = res.body.post_id;
    newPostFields['main_image_filename'] = res.body.main_image_filename;
    newPostFields['post_type_id'] = PostTypeDictionary.getTypeOffer();

    PostHelper.validateDbEntity(newPostFields, lastPost);
    PostHelper.validateDbEntity(newPostOfferFields, lastPost['post_offer']);

    await FileToUploadHelper.isFileUploaded(lastPost.main_image_filename);
  });

  it('Not possible to create post without token', async () => {
    const res = await request(server)
        .post(postOfferUrl)
    ;

    ResponseHelper.expectStatusUnauthorized(res);
  });
});
