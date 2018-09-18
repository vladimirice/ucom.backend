const request = require('supertest');
const server = require('../../../app');
const expect = require('expect');

const helpers = require('../helpers');

const UserHelper = require('../helpers/users-helper');
const SeedsHelper = require('../helpers/seeds-helper');
const PostHelper = require('../helpers/posts-helper');
const RequestHelper = require('../helpers/request-helper');
const ResponseHelper = require('../helpers/response-helper');
const FileToUploadHelper = require('../helpers/file-to-upload-helper');
const PostTypeDictionary = require('../../../lib/posts/post-type-dictionary');
const PostOfferRepository = require('../../../lib/posts/post-offer/post-offer-repository');
const PostsRepository = require('../../../lib/posts/posts-repository');
const PostStatsRepository = require('../../../lib/posts/stats/post-stats-repository');

const PostsService = require('./../../../lib/posts/post-service');

const avatarPath = `${__dirname}/../../../seeders/images/ankr_network.png`;

const postOfferUrl = '/api/v1/posts';
const rootUrl = RequestHelper.getPostsUrl();
const postsUrl = '/api/v1/posts';

let userVlad, userJane;

describe('Posts API', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
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


  describe('Sanitizing', () => {
    it('should sanitize post text fields', async () => {
      const post_id = 1;

      const fieldsToChange = {
        'title': '<script>alert("hello world!")</script><p>Html content</p> Simple text',
        'leading_text': '<script>alert("hello world!")</script><p>Html content</p> Simple text',
        'description': '<script>alert("hello world!")</script><p>Html text</p>',
      };

      const res = await request(server)
        .patch(helpers.RequestHelper.getOnePostUrl(post_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('title',         fieldsToChange['title'])
        .field('description',   fieldsToChange['description'])
        .field('leading_text',  fieldsToChange['leading_text'])
      ;

      ResponseHelper.expectStatusOk(res);

      const updatedPostId = res.body.post_id;

      const updatedPost = await PostsRepository.findOneById(updatedPostId);

      expect(updatedPost.title).toBe('Html content Simple text');
      expect(updatedPost.leading_text).toBe('Html content Simple text');
      expect(updatedPost.description).toBe('<p>Html text</p>');
    });

    it('should sanitize post offer extra fields', async () => {
      const post_id = 5;

      const fieldsToChange = {
        'action_button_title': '<script>alert("hello world!")</script><p>Html content</p> Simple text',
        'action_button_url': '<script>alert("hello world!")</script><a href="http://example.com">simple link</a>',
      };

      const res = await request(server)
        .patch(helpers.RequestHelper.getOnePostUrl(post_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('action_button_title', fieldsToChange['action_button_title'])
        .field('action_button_url',   fieldsToChange['action_button_url'])
      ;

      ResponseHelper.expectStatusOk(res);

      const updatedPostId = res.body.post_id;

      const updatedPost = await PostOfferRepository.findOneById(updatedPostId);

      expect(updatedPost['post_offer'].action_button_title).toBe('Html content Simple text');
      expect(updatedPost['post_offer'].action_button_url).toBe('<a href="http://example.com">simple link</a>');
    });
  });

  describe('Media post', function () {

    it('Create new Media Post by form data', async () => {
      const userVlad = await UserHelper.getUserVlad();

      const newPostFields = {
        'title': 'Extremely new post',
        'description': 'Our super post description',
        'leading_text': 'extremely leading text',
        'post_type_id': PostTypeDictionary.getTypeMediaPost(),
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

      const postStatsModel = await PostStatsRepository.findOneByPostId(newPost.id, true);
      expect(postStatsModel).toBeDefined();

      expect(postStatsModel.comments_count).toBe(0);
    });

    it('Update post by its author', async () => {
      const userVlad = await UserHelper.getUserVlad();

      let firstPostBefore = await PostsRepository.findLastMediaPostByAuthor(userVlad.id);
      await PostHelper.makeFieldNull(firstPostBefore.id, 'main_image_filename');
      firstPostBefore = await PostsRepository.findLastMediaPostByAuthor(userVlad.id);

      expect(firstPostBefore['main_image_filename']).toBeNull();

      const fieldsToChange = {
        'title': 'This is title to change',
        'description': 'Also necessary to change description',
        'leading_text': 'And leading text',
      };

      const res = await request(server)
        .patch(`${postsUrl}/${firstPostBefore['id']}`)
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('title',         fieldsToChange['title'])
        .field('description',   fieldsToChange['description'])
        .field('leading_text',  fieldsToChange['leading_text'])
        .attach('main_image_filename', avatarPath)
      ;

      ResponseHelper.expectStatusOk(res);

      const postAfter = await PostsService.findOneByIdAndAuthor(firstPostBefore['id'], userVlad.id);

      PostHelper.validatePatchResponse(res, postAfter);

      ResponseHelper.expectValuesAreExpected(fieldsToChange, postAfter);

      expect(postAfter.main_image_filename).toBeDefined();
      await FileToUploadHelper.isFileUploaded(postAfter.main_image_filename);
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

      const postStats = await PostStatsRepository.findOneByPostId(lastPost.id, true);

      expect(postStats).not.toBeNull();

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
        .field('post_users_team[0][id]', newPostUsersTeamFields[0]['user_id'])
        .field('post_users_team[1][id]', newPostUsersTeamFields[1]['user_id'])
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

    describe('Update posts', async () => {
      it('Update post-offer by its author', async () => {
        const userVlad = await UserHelper.getUserVlad();
        const firstPostBefore = await PostsService.findLastPostOfferByAuthor(userVlad.id);

        const fieldsToChange = {
          'leading_text': 'And leading text',
        };

        const fieldsPostOfferToChange = {
          'action_button_title': 'FOOBAR',
        };

        // Remove userVlad and add userJane
        const boardToChange = [
          {
            user_id: userJane.id
          }
        ];

        const res = await request(server)
          .patch(`${rootUrl}/${firstPostBefore.id}`)
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('leading_text',  fieldsToChange['leading_text'])
          .field('action_button_title',  fieldsPostOfferToChange['action_button_title'])
          .field('post_users_team[0][id]', boardToChange[0]['user_id'])
        ;

        ResponseHelper.expectStatusOk(res);

        const firstPostAfter = await PostOfferRepository.findOneById(firstPostBefore.id, true);

        ResponseHelper.expectValuesAreExpected(fieldsToChange, firstPostAfter);
        ResponseHelper.expectValuesAreExpected(fieldsPostOfferToChange, firstPostAfter['post_offer']);

        const postUsersTeam = firstPostAfter['post_users_team'];
        expect(postUsersTeam).toBeDefined();
        expect(postUsersTeam.length).toBe(1);

        const userJaneInTeam = postUsersTeam.find(data => data.user_id === userJane.id);
        expect(userJaneInTeam).toBeDefined();
        expect(userJaneInTeam.post_id).toBe(firstPostBefore.id);

        const userVladInTeam = postUsersTeam.find(data => data.user_id === userVlad.id);
        expect(userVladInTeam).not.toBeDefined();
      });
    });

    describe('Negative scenarios', async () => {
      it('Not possible to update post by user who is not its author', async () => {

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
  });
});