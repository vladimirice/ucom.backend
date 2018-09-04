const request = require('supertest');
const server = require('../../../../app');
const expect = require('expect');

const UserHelper = require('../../helpers/users-helper');
const SeedsHelper = require('../../helpers/seeds-helper');
const PostHelper = require('../../helpers/posts-helper');
const RequestHelper = require('../../helpers/request-helper');
const ResponseHelper = require('../../helpers/response-helper');
const FileToUploadHelper = require('../../helpers/file-to-upload-helper');
const PostTypeDictionary = require('../../../../lib/posts/post-type-dictionary');
const PostOfferRepository = require('../../../../lib/posts/post-offer/post-offer-repository');

const PostsService = require('./../../../../lib/posts/post-service');

const avatarPath = `${__dirname}/../../../../seeders/images/ankr_network.png`;

const postOfferUrl = '/api/v1/posts';
const rootUrl = RequestHelper.getPostsUrl();

let userVlad, userJane;

describe('Posts API', () => {
  beforeAll(async () => {
    [userVlad, userJane] = await Promise.all([
      UserHelper.getUserVlad(),
      UserHelper.getUserJane()
    ]);
  });

  beforeEach(async () => {
    await SeedsHelper.initPostOfferSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  it('Update post-offer by its author', async () => {
    const userVlad = await UserHelper.getUserVlad();
    const firstPostBefore = await PostsService.findLastPostOfferByAuthor(userVlad.id);

    const fieldsToChange = {
      'leading_text': 'And leading text',
    };

    const fieldsPostOfferToChange = {
      'action_button_title': 'FOOBAR',
    };

    const res = await request(server)
      .patch(`${rootUrl}/${firstPostBefore.id}`)
      .set('Authorization', `Bearer ${userVlad.token}`)
      .field('leading_text',  fieldsToChange['leading_text'])
      .field('action_button_title',  fieldsPostOfferToChange['action_button_title'])
    ;

    ResponseHelper.expectStatusOk(res);

    const firstPostAfter = await PostOfferRepository.findOneById(firstPostBefore.id, true);

    ResponseHelper.expectValuesAreChanged(fieldsToChange, firstPostAfter);
    ResponseHelper.expectValuesAreChanged(fieldsPostOfferToChange, firstPostAfter['post_offer']);
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

  describe('Negative scenarios', function () {
    // TODO - no post_type_id or it is malformed
  });


  it('Create new post-offer without board', async () => {
    let newPostFields = {
      'title': 'Extremely new post',
      'description': 'Our super post description',
      'leading_text': 'extremely leading text',
      'user_id': userVlad.id,
      'post_type_id': PostTypeDictionary.getTypeOffer(),
      'current_rate': '0.0000000000',
      'current_vote': 0,
    };

    let newPostOfferFields = {
      'action_button_title': 'TEST_BUTTON_CONTENT',
    };

    const res = await request(server)
      .post(postOfferUrl)
      .set('Authorization', `Bearer ${userVlad.token}`)
      .field('title', newPostFields['title'])
      .field('description', newPostFields['description'])
      .field('leading_text', newPostFields['leading_text'])
      .field('post_type_id', newPostFields['post_type_id'])
      .field('action_button_title', newPostOfferFields['action_button_title'])
      .attach('main_image_filename', avatarPath)
    ;

    ResponseHelper.expectStatusOk(res);

    const lastPost = await PostsService.findLastPostOfferByAuthor(userVlad.id);
    expect(lastPost).toBeDefined();
    expect(lastPost['post_offer']).not.toBeNull();

    expect(res.body.id).toBe(lastPost.id);
    PostHelper.validateDbEntity(newPostFields, lastPost);

    newPostOfferFields['post_id'] = res.body.id;
    PostHelper.validateDbEntity(newPostOfferFields, lastPost['post_offer']);

    await FileToUploadHelper.isFileUploaded(lastPost.main_image_filename);

    const postUsersTeam = lastPost['post_users_team'];
    expect(postUsersTeam).toBeDefined();
    expect(postUsersTeam.length).toBe(0);
  });

  it('Create new post-offer', async() => {
    let newPostFields = {
      'title': 'Extremely new post',
      'description': 'Our super post description',
      'leading_text': 'extremely leading text',
      'user_id': userVlad.id,
      'post_type_id': PostTypeDictionary.getTypeOffer(),
      'current_rate': '0.0000000000',
      'current_vote': 0,
    };

    let newPostOfferFields = {
      'action_button_title': 'TEST_BUTTON_CONTENT',
      'action_button_url': 'https://this-is-a-test.example.com',
      'action_duration_in_days': 500,
    };

    let newPostUsersTeamFields = [
      {
        'user_id': userVlad.id,
      },
      {
        'user_id': userJane.id,
      },
    ];

    const res = await request(server)
      .post(postOfferUrl)
      .set('Authorization', `Bearer ${userVlad.token}`)
      .field('title', newPostFields['title'])
      .field('description', newPostFields['description'])
      .field('leading_text', newPostFields['leading_text'])
      .field('post_type_id', newPostFields['post_type_id'])
      .field('action_button_title', newPostOfferFields['action_button_title'])
      .field('action_button_url', newPostOfferFields['action_button_url'])
      .field('action_duration_in_days', newPostOfferFields['action_duration_in_days'])
      .field('post_users_team[0][user_id]', newPostUsersTeamFields[0]['user_id'])
      .field('post_users_team[1][user_id]', newPostUsersTeamFields[1]['user_id'])
      .attach('main_image_filename', avatarPath)
    ;

    ResponseHelper.expectStatusOk(res);

    const lastPost = await PostsService.findLastPostOfferByAuthor(userVlad.id);
    expect(lastPost).toBeDefined();
    expect(lastPost['post_offer']).not.toBeNull();

    expect(res.body.id).toBe(lastPost.id);
    PostHelper.validateDbEntity(newPostFields, lastPost);

    newPostOfferFields['post_id'] = res.body.id;
    PostHelper.validateDbEntity(newPostOfferFields, lastPost['post_offer']);

    await FileToUploadHelper.isFileUploaded(lastPost.main_image_filename);

    const postUsersTeam = lastPost['post_users_team'];
    expect(postUsersTeam).toBeDefined();
    newPostUsersTeamFields.forEach(teamMember => {
      const record = postUsersTeam.find(data => data.user_id === teamMember.user_id);
      expect(record).toBeDefined();
      expect(record.post_id).toBe(lastPost.id);
    });
  });

  it('Not possible to create post without token', async () => {
    const res = await request(server)
        .post(postOfferUrl)
    ;

    ResponseHelper.expectStatusUnauthorized(res);
  });
});
