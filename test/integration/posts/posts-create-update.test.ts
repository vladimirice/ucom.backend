/* tslint:disable */
export {};

const request = require('supertest');
const server = require('../../../app');
const expect = require('expect');

const helpers = require('../helpers');
const gen = require('../../generators');

const userHelper      = helpers.UserHelper;
const seedsHelper     = helpers.Seeds;
const requestHelper   = helpers.Req;
const responseHelper  = helpers.Res;

const postOfferRepository     = require('../../../lib/posts/repository').PostOffer;
const postsRepository         = require('../../../lib/posts/repository').MediaPosts;
const postStatsRepository     = require('../../../lib/posts/stats/post-stats-repository');
const usersActivityRepository = require('../../../lib/users/repository').Activity;

const activityGroupDictionary = require('../../../lib/activity/activity-group-dictionary');
const ContentTypeDictionary   = require('ucom-libs-social-transactions').ContentTypeDictionary;

const postsModelProvider      = require('../../../lib/posts/service').ModelProvider;
const usersModelProvider      = require('../../../lib/users/service').ModelProvider;

const postsService            = require('./../../../lib/posts/post-service');

const avatarPath = helpers.FileToUpload.getSampleFilePathToUpload();

const postOfferUrl  = helpers.Req.getPostsUrl();
const rootUrl       = requestHelper.getPostsUrl();
const postsUrl      = helpers.Req.getPostsUrl();

let userVlad;
let userJane;

helpers.Mock.mockAllBlockchainPart();

describe('Posts API', () => {
  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane] = await Promise.all([
      userHelper.getUserVlad(),
      userHelper.getUserJane(),
    ]);
  });

  beforeEach(async () => {
    await seedsHelper.initPostOfferSeeds();
  });

  afterAll(async () => {
    await seedsHelper.sequelizeAfterAll();
  });

  describe('Sanitizing', () => {
    it('should preserve images', async () => {
      const postId = 1;

      const fieldsToChange = {
        // tslint:disable-next-line
        description: '<div><strike>this is strike</strike><i>extra_text</i><div><a href="https://example.com">test href</a><p>1000 UOS tokens as is.</p><p>&lt;/p&gt;&lt;script&gt;alert(\'123\')&lt;/script&gt;2</p><div><figure>\n' +
      '    <img src="https://backend.u.community/upload/post-image-1537444720877.jpg" />\n' +
      '        \n' +
      '</figure></div><p> </p><p></p><div>\n' +
      '    <ul>\n' +
      '            <li></li>\n' +
      '            <li></li>\n' +
      '    </ul>\n' +
      '</div></div></div>',
      };

      const res = await request(server)
        .patch(helpers.RequestHelper.getOnePostUrl(postId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description',   fieldsToChange['description'])
      ;

      responseHelper.expectStatusOk(res);

      const updatedPostId = res.body.post_id;

      const updatedPost = await postsRepository.findOnlyPostItselfById(updatedPostId);

      expect(updatedPost.description).toBe(fieldsToChange['description']);
    });

    it('Should preserve iframe and attributes', async () => {

      const postId = 1;

      const fieldsToChange = { description :
        `<div class="medium-insert-embeds">
 <figure>
  <div class="medium-insert-embed">
   <div><div style="left:0;width:100%;height:0;position:relative;padding-bottom:56.2493%;"><iframe src="https://www.youtube.com/embed/FYNsYz-nOsI?feature=oembed" style="border:0;top:0;left:0;width:100%;height:100%;position:absolute;" allowfullscreen scrolling="no"></iframe></div></div>
  </div>
 </figure>

</div><p class="12345">a</p>`,
      };

      const res = await request(server)
        .patch(helpers.RequestHelper.getOnePostUrl(postId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description',   fieldsToChange['description'])
      ;

      responseHelper.expectStatusOk(res);

      const updatedPostId = res.body.post_id;

      const updatedPost = await postsRepository.findOnlyPostItselfById(updatedPostId);

      expect(updatedPost.description).toBe(fieldsToChange['description']);
    });

    it('should sanitize post text fields', async () => {
      const postId = 1;

      const fieldsToChange = {
        title: '<script>alert("hello world!")</script><p>Html content</p> Simple text',
        leading_text: '<script>alert("hello world!")</script><p>Html content</p> Simple text',
        description: '<script>alert("hello world!")</script><p>Html text</p>',
      };

      const res = await request(server)
        .patch(helpers.RequestHelper.getOnePostUrl(postId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('title',         fieldsToChange['title'])
        .field('description',   fieldsToChange['description'])
        .field('leading_text',  fieldsToChange['leading_text'])
      ;

      responseHelper.expectStatusOk(res);

      const updatedPostId = res.body.post_id;

      const updatedPost = await postsRepository.findOnlyPostItselfById(updatedPostId);

      expect(updatedPost.title).toBe('Html content Simple text');
      expect(updatedPost.leading_text).toBe('Html content Simple text');
      expect(updatedPost.description).toBe('<p>Html text</p>');
    });

    it('should sanitize post offer extra fields', async () => {
      const postId = 5;

      const fieldsToChange = {
        // tslint:disable-next-line:max-line-length
        action_button_title: '<script>alert("hello world!")</script><p>Html content</p> Simple text',
        // tslint:disable-next-line:max-line-length
        action_button_url: '<script>alert("hello world!")</script><a href="http://example.com">simple link</a>',
      };

      const res = await request(server)
        .patch(helpers.RequestHelper.getOnePostUrl(postId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('action_button_title', fieldsToChange['action_button_title'])
        .field('action_button_url',   fieldsToChange['action_button_url'])
      ;

      responseHelper.expectStatusOk(res);

      const updatedPostId = res.body.post_id;

      const updatedPost = await postOfferRepository.findOneById(updatedPostId);

      expect(updatedPost['post_offer'].action_button_title).toBe('Html content Simple text');
      expect(updatedPost['post_offer'].action_button_url)
        .toBe('<a href="http://example.com">simple link</a>');
    });
  });

  describe('Media post creation', () => {
    describe('Positive', () => {
      it('Create media post without any images', async () => {
        const myself = userVlad;

        const newPostFields = {
          title: 'Extremely new post',
          description: 'Our super post description',
          leading_text: 'extremely leading text',
          post_type_id: ContentTypeDictionary.getTypeMediaPost(),

          entity_images: null,
          main_image_filename: null,
        };

        const res = await request(server)
          .post(postsUrl)
          .set('Authorization', `Bearer ${myself.token}`)
          .field('title', newPostFields['title'])
          .field('description', newPostFields['description'])
          .field('post_type_id', newPostFields['post_type_id'])
          .field('leading_text', newPostFields['leading_text'])
          .field('entity_images', '')
        ;

        helpers.Res.expectStatusOk(res);

        const posts = await helpers.Post.requestToGetManyPostsAsGuest();
        const newPost = posts.find(data => data.title === newPostFields['title']);

        expect(newPost).toMatchObject(newPostFields);
      });

      it('Create media post with entity_images', async () => {
        const myself = userVlad;

        const newPostFields = {
          title: 'Extremely new post',
          description: 'Our super post description',
          leading_text: 'extremely leading text',
          post_type_id: ContentTypeDictionary.getTypeMediaPost(),
          entity_images: {
            article_title: [
              {
                url: 'http://localhost:3000/upload/sample_filename_5.jpg',
              },
            ],
          },
        };

        const res = await request(server)
          .post(postsUrl)
          .set('Authorization', `Bearer ${myself.token}`)
          .field('title', newPostFields['title'])
          .field('description', newPostFields['description'])
          .field('post_type_id', newPostFields['post_type_id'])
          .field('leading_text', newPostFields['leading_text'])
          .field('entity_images', JSON.stringify(newPostFields['entity_images']))
        ;

        helpers.Res.expectStatusOk(res);

        const posts = await helpers.Post.requestToGetManyPostsAsGuest();

        // const posts = await PostsRepository.findAllByAuthor(myself.id);
        const newPost = posts.find(data => data.title === newPostFields['title']);
        expect(newPost).toBeDefined();

        expect(newPost.main_image_filename).toBeNull();

        helpers.Post.checkEntityImages(newPost);

        expect(newPost).toMatchObject(newPostFields);
      });

      it('Create media post', async () => {
        const myself = userVlad;

        const newPostFields = {
          title: 'Extremely new post',
          description: 'Our super post description',
          leading_text: 'extremely leading text',
          post_type_id: ContentTypeDictionary.getTypeMediaPost(),
          user_id: myself.id,
          current_rate: 0.0000000000,
          current_vote: 0,
        };

        const res = await request(server)
          .post(postsUrl)
          .set('Authorization', `Bearer ${myself.token}`)
          .field('title', newPostFields['title'])
          .field('description', newPostFields['description'])
          .field('post_type_id', newPostFields['post_type_id'])
          .field('leading_text', newPostFields['leading_text'])
          .attach('main_image_filename', avatarPath)
        ;

        helpers.Res.expectStatusOk(res);

        const posts = await postsRepository.findAllByAuthor(myself.id);
        const newPost = posts.find(data => data.title === newPostFields['title']);
        expect(newPost).toBeDefined();

        const body = res.body;

        expect(body.id).toBe(newPost.id);

        await helpers.FileToUpload.isFileUploaded(newPost.main_image_filename);

        const postStatsModel = await postStatsRepository.findOneByPostId(newPost.id, true);
        expect(postStatsModel).toBeDefined();

        expect(postStatsModel.comments_count).toBe(0);

        await helpers.Posts.expectPostDbValues(newPost, {
          entity_id_for:    `${myself.id}`,
          entity_name_for:  usersModelProvider.getEntityName(),
        });

        helpers.Post.checkEntityImages(newPost);
      });
    });

    describe('Negative', () => {
      it('bad request error if title too long', async () => {
        const myself = userVlad;

        const title = requestHelper.makeRandomString(256);

        const newPostFields = {
          title: title,
          description: 'Our super post description',
          leading_text: 'extremely leading text',
          post_type_id: ContentTypeDictionary.getTypeMediaPost(),
          user_id: myself.id,
        };

        const res = await request(server)
          .post(postsUrl)
          .set('Authorization', `Bearer ${myself.token}`)
          .field('title', newPostFields['title'])
          .field('description', newPostFields['description'])
          .field('post_type_id', newPostFields['post_type_id'])
          .field('leading_text', newPostFields['leading_text'])
          .attach('main_image_filename', avatarPath)
        ;

        helpers.Res.expectStatusBadRequest(res);
      });
      it('bad request error if leading_text is too long', async () => {
        const myself = userVlad;

        const leadingText = requestHelper.makeRandomString(256);

        const newPostFields = {
          title: 'New title for post',
          description: 'Our super post description',
          leading_text: leadingText,
          post_type_id: ContentTypeDictionary.getTypeMediaPost(),
          user_id: myself.id,
        };

        const res = await request(server)
          .post(postsUrl)
          .set('Authorization', `Bearer ${myself.token}`)
          .field('title', newPostFields['title'])
          .field('description', newPostFields['description'])
          .field('post_type_id', newPostFields['post_type_id'])
          .field('leading_text', newPostFields['leading_text'])
          .attach('main_image_filename', avatarPath)
        ;

        helpers.Res.expectStatusBadRequest(res);
      });

      it('It is not possible to create post without token', async () => {

        const res = await request(server)
          .post(postsUrl)
        ;

        responseHelper.expectStatusUnauthorized(res);
      });
    });
  });

  describe('Update post', () => {

    describe('Positive', () => {
      it('Media Post updating should lead to updating activity', async () => {
        await helpers.Seeds.initUsersOnly(); // this means that seeds are not used in this autotest

        const postId = await gen.Posts.createMediaPostByUserHimself(userVlad);

        const fieldsToChange = {
          title: 'This is title to change',
          description: 'Also necessary to change description',
          leading_text: 'And leading text',
        };

        const res = await request(server)
          .patch(`${postsUrl}/${postId}`)
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('title',         fieldsToChange['title'])
          .field('description',   fieldsToChange['description'])
          .field('leading_text',  fieldsToChange['leading_text'])
        ;

        helpers.Res.expectStatusOk(res);

        // expect required users activity
        const activity  =
          await usersActivityRepository.findLastByUserIdAndEntityId(userVlad.id, postId);
        // expect this is updating

        expect(activity.activity_group_id).toBe(activityGroupDictionary.getGroupContentUpdating());
        expect(activity.activity_type_id).toBe(ContentTypeDictionary.getTypeMediaPost());
        expect(activity.event_id).toBeNull();
      });

      it('Update Media Post and also update entity_images', async () => {
        const userVlad = await helpers.Users.getUserVlad();

        const firstPostBefore = await postsRepository.findLastMediaPostByAuthor(userVlad.id);
        // await helpers.Posts.makeFieldNull(firstPostBefore.id, 'main_image_filename');

        const fieldsToChange = {
          title: 'This is title to change',
          description: 'Also necessary to change description',
          leading_text: 'And leading text',
          entity_images: {
            article_title: [
              {
                url: 'http://localhost:3000/upload/sample_filename_5.jpg',
              },
            ],
          },
        };

        const res = await request(server)
          .patch(`${postsUrl}/${firstPostBefore['id']}`)
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('title',         fieldsToChange['title'])
          .field('description',   fieldsToChange['description'])
          .field('leading_text',  fieldsToChange['leading_text'])
          .field('entity_images',  JSON.stringify(fieldsToChange['entity_images']))
        ;

        helpers.Res.expectStatusOk(res);

        const postAfter =
          await postsRepository.findOneByIdAndAuthor(firstPostBefore.id, userVlad.id, true);

        helpers.Posts.validatePatchResponse(res, postAfter);

        helpers.Res.expectValuesAreExpected(fieldsToChange, postAfter);

        // entity_images field do not change main_image_filename
        expect(firstPostBefore.main_image_filename).toBe(postAfter.main_image_filename);

        helpers.Post.checkEntityImages(postAfter);
      });

      it('Update Media Post by its author', async () => {
        const userVlad = await helpers.Users.getUserVlad();

        let firstPostBefore = await postsRepository.findLastMediaPostByAuthor(userVlad.id);
        await helpers.Posts.makeFieldNull(firstPostBefore.id, 'main_image_filename');
        firstPostBefore = await postsRepository.findLastMediaPostByAuthor(userVlad.id);

        expect(firstPostBefore['main_image_filename']).toBeNull();

        const fieldsToChange = {
          title: 'This is title to change',
          description: 'Also necessary to change description',
          leading_text: 'And leading text',
        };

        const res = await request(server)
          .patch(`${postsUrl}/${firstPostBefore['id']}`)
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('title',         fieldsToChange['title'])
          .field('description',   fieldsToChange['description'])
          .field('leading_text',  fieldsToChange['leading_text'])
          .attach('main_image_filename', avatarPath)
        ;

        helpers.Res.expectStatusOk(res);

        const postAfter =
          await postsRepository.findOneByIdAndAuthor(firstPostBefore.id, userVlad.id, true);

        helpers.Posts.validatePatchResponse(res, postAfter);

        helpers.Res.expectValuesAreExpected(fieldsToChange, postAfter);

        expect(postAfter.main_image_filename).toBeDefined();
        await helpers.FileToUpload.isFileUploaded(postAfter.main_image_filename);

        helpers.Post.checkEntityImages(postAfter);
      });
    });

    describe('Negative', () => {
      it('Media post. Not possible to update post by user who is not its author', async () => {
        const postId = await postsRepository.findLastMediaPostIdByAuthor(userJane.id);

        const res = await request(server)
          .patch(helpers.Req.getOnePostUrl(postId))
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('title', 'Vlad title for Jane post')
        ;

        responseHelper.expectStatusNotFound(res);
      });
    });
  });

  describe('User himself posts related activity', () => {
    it('Media post. Should create valid activity record', async () => {
      const user = userVlad;

      // noinspection JSDeprecatedSymbols
      const newPostId = await helpers.Post.requestToCreateMediaPost(user);
      const activity =
        await usersActivityRepository.findLastByUserIdAndEntityId(userVlad.id, newPostId);
      expect(activity).not.toBeNull();

      const expectedValues = {
        activity_type_id:   ContentTypeDictionary.getTypeMediaPost(), // media post creation
        activity_group_id:  activityGroupDictionary.getGroupContentCreation(),
        entity_id_to:       `${newPostId}`,
        entity_name:        postsModelProvider.getEntityName(),
        user_id_from:       user.id,
      };

      helpers.Res.expectValuesAreExpected(expectedValues, activity);
    });
  });

  describe('skipped tests', () => {
    it.skip('Create post-offer without board', async () => {
      // Post offer feature is not required and frozen

      const newPostFields = {
        title: 'Extremely new post',
        description: 'Our super post description',
        leading_text: 'extremely leading text',
        user_id: userVlad.id,
        post_type_id: ContentTypeDictionary.getTypeOffer(),
        current_rate: '0.0000000000',
        current_vote: 0,
      };

      const newPostOfferFields = {
        action_button_title: 'TEST_BUTTON_CONTENT',
      };

      const res = await request(server)
        .post(postOfferUrl)
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('title', newPostFields['title'])
        .field('description', newPostFields['description'])
        .field('leading_text', newPostFields['leading_text'])
        .field('post_type_id', newPostFields['post_type_id'])
        .field('action_button_title', newPostOfferFields['action_button_title'])
        .field('post_users_team[]', '') // this is to catch and fix bug by TDD
        .attach('main_image_filename', avatarPath)
      ;

      helpers.Res.expectStatusOk(res);

      const lastPost = await postsService.findLastPostOfferByAuthor(userVlad.id);
      expect(lastPost).toBeDefined();
      expect(lastPost['post_offer']).not.toBeNull();

      expect(res.body.id).toBe(lastPost.id);
      helpers.Posts.validateDbEntity(newPostFields, lastPost);

      newPostOfferFields['post_id'] = res.body.id;
      helpers.Posts.validateDbEntity(newPostOfferFields, lastPost['post_offer']);

      await helpers.FileToUpload.isFileUploaded(lastPost.main_image_filename);

      const postUsersTeam = lastPost['post_users_team'];
      expect(postUsersTeam).toBeDefined();
      expect(postUsersTeam.length).toBe(0);

      const postStats = await postStatsRepository.findOneByPostId(lastPost.id, true);

      expect(postStats).not.toBeNull();

      // UPDATE only button
      const fieldsPostOfferToChange = {
        action_button_title: 'FOOBAR',
      };

      const patchRes = await request(server)
        .patch(`${rootUrl}/${lastPost.id}`)
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('action_button_title',  fieldsPostOfferToChange['action_button_title'])
        .field('post_users_team[]', '') // this is to catch and fix bug by TDD
      ;

      helpers.Res.expectStatusOk(patchRes);

      const firstPostAfter = await postOfferRepository.findOneById(lastPost.id, true);
      expect(firstPostAfter['post_offer']['action_button_title'])
        .toBe(fieldsPostOfferToChange['action_button_title']);

      await helpers.Posts.expectPostDbValues(lastPost, {
        entity_id_for:    `${userVlad.id}`,
        entity_name_for:  usersModelProvider.getEntityName(),
      });
    });
    it.skip('Post-offer. Should create valid activity record', async () => {
      const user = userVlad;

      // noinspection JSDeprecatedSymbols
      const newPostId = await helpers.Post.requestToCreatePostOffer(user);
      const activity  = await usersActivityRepository.findLastByUserIdAndEntityId(
        userVlad.id,
        newPostId,
      );
      expect(activity).not.toBeNull();

      const expectedValues = {
        activity_type_id:   ContentTypeDictionary.getTypeOffer(), // media post creation
        activity_group_id:  activityGroupDictionary.getGroupContentCreation(),
        entity_id_to:       `${newPostId}`,
        entity_name:        postsModelProvider.getEntityName(),
        user_id_from:       user.id,
      };

      helpers.Res.expectValuesAreExpected(expectedValues, activity);
    });
    it.skip('Update post-offer by its author', async () => {
      const userVlad = await userHelper.getUserVlad();
      const firstPostBefore = await postsService.findLastPostOfferByAuthor(userVlad.id);

      const fieldsToChange = {
        leading_text: 'And leading text',
      };

      const fieldsPostOfferToChange = {
        action_button_title: 'FOOBAR',
      };

      // Remove userVlad and add userJane
      const boardToChange = [
        {
          user_id: userJane.id,
        },
      ];

      const res = await request(server)
        .patch(`${rootUrl}/${firstPostBefore.id}`)
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('leading_text',  fieldsToChange['leading_text'])
        .field('action_button_title',  fieldsPostOfferToChange['action_button_title'])
        .field('post_users_team[0][id]', boardToChange[0]['user_id'])
      ;

      responseHelper.expectStatusOk(res);

      const firstPostAfter = await postOfferRepository.findOneById(firstPostBefore.id, true);

      responseHelper.expectValuesAreExpected(fieldsToChange, firstPostAfter);
      responseHelper.expectValuesAreExpected(fieldsPostOfferToChange, firstPostAfter['post_offer']);

      const postUsersTeam = firstPostAfter['post_users_team'];
      expect(postUsersTeam).toBeDefined();
      expect(postUsersTeam.length).toBe(1);

      const userJaneInTeam = postUsersTeam.find(data => data.user_id === userJane.id);
      expect(userJaneInTeam).toBeDefined();
      expect(userJaneInTeam.post_id).toBe(firstPostBefore.id);

      const userVladInTeam = postUsersTeam.find(data => data.user_id === userVlad.id);
      expect(userVladInTeam).not.toBeDefined();
    });
    it.skip('not possible to create media post or post offer as direct post', async () => {
    });
    it.skip('not possible to change entity_id_for and entity_name_for by request', async () => {
    });
    it.skip('Create post-offer with board', async() => {
      const newPostFields = {
        title: 'Extremely new post',
        description: 'Our super post description',
        leading_text: 'extremely leading text',
        user_id: userVlad.id,
        post_type_id: ContentTypeDictionary.getTypeOffer(),
        current_rate: '0.0000000000',
        current_vote: 0,
      };

      const newPostOfferFields = {
        action_button_title: 'TEST_BUTTON_CONTENT',
        action_button_url: 'https://this-is-a-test.example.com',
        action_duration_in_days: 500,
      };

      const newPostUsersTeamFields = [
        {
          user_id: userVlad.id,
        },
        {
          user_id: userJane.id,
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

      helpers.Res.expectStatusOk(res);

      const lastPost = await postsService.findLastPostOfferByAuthor(userVlad.id);
      expect(lastPost).toBeDefined();
      expect(lastPost['post_offer']).not.toBeNull();

      expect(res.body.id).toBe(lastPost.id);
      helpers.Posts.validateDbEntity(newPostFields, lastPost);

      newPostOfferFields['post_id'] = res.body.id;
      helpers.Posts.validateDbEntity(newPostOfferFields, lastPost['post_offer']);

      await helpers.FileToUpload.isFileUploaded(lastPost.main_image_filename);

      const postUsersTeam = lastPost['post_users_team'];
      expect(postUsersTeam).toBeDefined();
      newPostUsersTeamFields.forEach((teamMember) => {
        const record = postUsersTeam.find(data => data.user_id === teamMember.user_id);
        expect(record).toBeDefined();
        expect(record.post_id).toBe(lastPost.id);
      });

      await helpers.Posts.expectPostDbValues(lastPost, {
        entity_id_for:    `${userVlad.id}`,
        entity_name_for:  usersModelProvider.getEntityName(),
      });
    });
    it.skip('For other organization without making from organization', async () => {
    });
  });
});
