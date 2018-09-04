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

  it('Not possible to create post without token', async () => {
    const res = await request(server)
        .post(postOfferUrl)
    ;

    ResponseHelper.expectStatusUnauthorized(res);
  });
});
