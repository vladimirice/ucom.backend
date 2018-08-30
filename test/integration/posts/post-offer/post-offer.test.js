const request = require('supertest');
const server = require('../../../../app');
const expect = require('expect');
const fs = require('fs');

const UsersHelper = require('../../helpers/users-helper');
const SeedsHelper = require('../../helpers/seeds-helper');
const PostHelper = require('../../helpers/posts-helper');
const ResponseHelper = require('../../helpers/response-helper');
const FileToUploadHelper = require('../../helpers/file-to-upload-helper');
const PostTypeDictionary = require('../../../../lib/posts/post-type-dictionary');

const PostsService = require('./../../../../lib/posts/post-service');

const avatarPath = `${__dirname}/../../../../seeders/images/ankr_network.png`;

const postOfferUrl = '/api/v1/posts/offers';

const { avatarStoragePath } = require('../../../../lib/users/avatar-upload-middleware');

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
