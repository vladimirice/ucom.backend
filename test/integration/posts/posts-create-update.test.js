const request = require('supertest');
const server = require('../../../app');
const expect = require('expect');

const helpers = require('../helpers');
const gen     = require('../../generators');

const UserHelper      = helpers.UserHelper;
const SeedsHelper     = helpers.Seeds;
const RequestHelper   = helpers.Req;
const ResponseHelper  = helpers.Res;

const PostOfferRepository     = require('../../../lib/posts/repository').PostOffer;
const PostsRepository         = require('../../../lib/posts/repository').MediaPosts;
const PostStatsRepository     = require('../../../lib/posts/stats/post-stats-repository');
const UsersActivityRepository = require('../../../lib/users/repository').Activity;

const ActivityGroupDictionary = require('../../../lib/activity/activity-group-dictionary');
const ContentTypeDictionary   = require('ucom-libs-social-transactions').ContentTypeDictionary;

const PostsModelProvider      = require('../../../lib/posts/service').ModelProvider;
const UsersModelProvider      = require('../../../lib/users/service').ModelProvider;
const OrgModelProvider        = require('../../../lib/organizations/service').ModelProvider;

const PostsService            = require('./../../../lib/posts/post-service');

const avatarPath = helpers.FileToUpload.getSampleFilePathToUpload();

const postOfferUrl  = helpers.Req.getPostsUrl();
const rootUrl       = RequestHelper.getPostsUrl();
const postsUrl      = helpers.Req.getPostsUrl();

let userVlad, userJane;

helpers.Mock.mockAllBlockchainPart();

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
    it('should preserve images', async () => {
      const post_id = 1;

      const fieldsToChange = {
      'description': '<div><strike>this is strike</strike><i>extra_text</i><div><a href="https://example.com">test href</a><p>1000 UOS tokens as is.</p><p>&lt;/p&gt;&lt;script&gt;alert(\'123\')&lt;/script&gt;2</p><div><figure>\n' +
      '    <img src="https://backend.u.community/upload/post-image-1537444720877.jpg" />\n' +
      '        \n' +
      '</figure></div><p> </p><p></p><div>\n' +
      '    <ul>\n' +
      '            <li></li>\n' +
      '            <li></li>\n' +
      '    </ul>\n' +
      '</div></div></div>'
      };

      const res = await request(server)
        .patch(helpers.RequestHelper.getOnePostUrl(post_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description',   fieldsToChange['description'])
      ;

      ResponseHelper.expectStatusOk(res);

      const updatedPostId = res.body.post_id;

      const updatedPost = await PostsRepository.findOnlyPostItselfById(updatedPostId);

      expect(updatedPost.description).toBe(fieldsToChange['description']);
    });

    it('Should preserve iframe and attributes', async () => {

      const post_id = 1;

      const fieldsToChange = { 'description' :
        `<div class="medium-insert-embeds">
 <figure>
  <div class="medium-insert-embed">
   <div><div style="left:0;width:100%;height:0;position:relative;padding-bottom:56.2493%;"><iframe src="https://www.youtube.com/embed/FYNsYz-nOsI?feature=oembed" style="border:0;top:0;left:0;width:100%;height:100%;position:absolute;" allowfullscreen scrolling="no"></iframe></div></div>
  </div>
 </figure>
 
</div><p class="12345">a</p>`
      };

      const res = await request(server)
        .patch(helpers.RequestHelper.getOnePostUrl(post_id))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description',   fieldsToChange['description'])
      ;

      ResponseHelper.expectStatusOk(res);

      const updatedPostId = res.body.post_id;

      const updatedPost = await PostsRepository.findOnlyPostItselfById(updatedPostId);

      expect(updatedPost.description).toBe(fieldsToChange['description']);
    });

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

      const updatedPost = await PostsRepository.findOnlyPostItselfById(updatedPostId);

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

  describe('Create post', () => {
    describe('Positive', () => {
      it('Create media post', async () => {
        const myself = userVlad;

        const newPostFields = {
          'title': 'Extremely new post',
          'description': 'Our super post description',
          'leading_text': 'extremely leading text',
          'post_type_id': ContentTypeDictionary.getTypeMediaPost(),
          'user_id': myself.id,
          'current_rate': 0.0000000000,
          'current_vote': 0,
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

        const posts = await PostsRepository.findAllByAuthor(myself.id);
        const newPost = posts.find(data => data.title === newPostFields['title']);
        expect(newPost).toBeDefined();

        const body = res.body;

        expect(body.id).toBe(newPost.id);

        await helpers.FileToUpload.isFileUploaded(newPost.main_image_filename);

        const postStatsModel = await PostStatsRepository.findOneByPostId(newPost.id, true);
        expect(postStatsModel).toBeDefined();

        expect(postStatsModel.comments_count).toBe(0);

        await helpers.Posts.expectPostDbValues(newPost, {
          'entity_id_for':    "" + myself.id,
          'entity_name_for':  UsersModelProvider.getEntityName(),
        });
      });

      it('Create post-offer without board', async () => {
        let newPostFields = {
          'title': 'Extremely new post',
          'description': 'Our super post description',
          'leading_text': 'extremely leading text',
          'user_id': userVlad.id,
          'post_type_id': ContentTypeDictionary.getTypeOffer(),
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
          .field('post_users_team[]', '') // this is to catch and fix bug by TDD
          .attach('main_image_filename', avatarPath)
        ;

        helpers.Res.expectStatusOk(res);

        const lastPost = await PostsService.findLastPostOfferByAuthor(userVlad.id);
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

        const postStats = await PostStatsRepository.findOneByPostId(lastPost.id, true);

        expect(postStats).not.toBeNull();

        // UPDATE only button
        const fieldsPostOfferToChange = {
          'action_button_title': 'FOOBAR',
        };

        const patchRes = await request(server)
          .patch(`${rootUrl}/${lastPost.id}`)
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('action_button_title',  fieldsPostOfferToChange['action_button_title'])
          .field('post_users_team[]', '') // this is to catch and fix bug by TDD
        ;

        helpers.Res.expectStatusOk(patchRes);

        const firstPostAfter = await PostOfferRepository.findOneById(lastPost.id, true);
        expect(firstPostAfter['post_offer']['action_button_title']).toBe(fieldsPostOfferToChange['action_button_title']);

        await helpers.Posts.expectPostDbValues(lastPost, {
          'entity_id_for':    "" + userVlad.id,
          'entity_name_for':  UsersModelProvider.getEntityName(),
        });

      });
      it('Create post-offer with board', async() => {
        let newPostFields = {
          'title': 'Extremely new post',
          'description': 'Our super post description',
          'leading_text': 'extremely leading text',
          'user_id': userVlad.id,
          'post_type_id': ContentTypeDictionary.getTypeOffer(),
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

        helpers.Res.expectStatusOk(res);

        const lastPost = await PostsService.findLastPostOfferByAuthor(userVlad.id);
        expect(lastPost).toBeDefined();
        expect(lastPost['post_offer']).not.toBeNull();

        expect(res.body.id).toBe(lastPost.id);
        helpers.Posts.validateDbEntity(newPostFields, lastPost);

        newPostOfferFields['post_id'] = res.body.id;
        helpers.Posts.validateDbEntity(newPostOfferFields, lastPost['post_offer']);

        await helpers.FileToUpload.isFileUploaded(lastPost.main_image_filename);

        const postUsersTeam = lastPost['post_users_team'];
        expect(postUsersTeam).toBeDefined();
        newPostUsersTeamFields.forEach(teamMember => {
          const record = postUsersTeam.find(data => data.user_id === teamMember.user_id);
          expect(record).toBeDefined();
          expect(record.post_id).toBe(lastPost.id);
        });

        await helpers.Posts.expectPostDbValues(lastPost, {
          'entity_id_for':    "" + userVlad.id,
          'entity_name_for':  UsersModelProvider.getEntityName(),
        });
      });

      describe('Create direct post', () => {
        it('Create direct post with picture', async () => {
          const post = await gen.Posts.createUserDirectPostForOtherUser(userVlad, userJane, null, true);
          expect(post.main_image_filename).toBeDefined();

          await helpers.FileToUpload.isFileUploaded(post.main_image_filename);
        });

        it('Create direct post for org with picture', async () => {
          const orgId = await gen.Org.createOrgWithoutTeam(userJane);

          const post = await gen.Posts.createDirectPostForOrganization(userVlad, orgId, null, true);
          expect(post.main_image_filename).toBeDefined();

          await helpers.FileToUpload.isFileUploaded(post.main_image_filename);
        });

        it('For User without organization', async () => {
          const user = userVlad;
          const targetUser = userJane;

          const newPostFields = {
            description: 'Our super post description',
          };

          const expected = {
            'entity_id_for':    "" + targetUser.id,
            'entity_name_for':  UsersModelProvider.getEntityName(),
          };

          // noinspection JSDeprecatedSymbols
          const post = await helpers.Posts.requestToCreateDirectPostForUser(user, targetUser, newPostFields.description);

          const options = {
            myselfData: true,
            postProcessing: 'full'
          };

          await helpers.Common.checkOnePostForPage(post, options);

          await helpers.Common.checkDirectPostInDb(post, {
            ...expected,
            ...newPostFields
          }, user);
        });

        it('For organization without organization', async () => {
          const user = userVlad;
          const targetOrgId = 1;

          const newPostFields = {
            description: 'Our super post description',
          };

          const expected = {
            'entity_id_for':    "" + targetOrgId,
            'entity_name_for':  OrgModelProvider.getEntityName(),
          };

          // noinspection JSDeprecatedSymbols
          const post = await helpers.Posts.requestToCreateDirectPostForOrganization(user, targetOrgId, newPostFields.description);

          const options = {
            myselfData: true,
            postProcessing: 'full'
          };

          await helpers.Common.checkOnePostForPage(post, options);
          await helpers.Common.checkDirectPostInDb(post, {
            ...expected,
            ...newPostFields
          }, user);
        });

        it.skip('For other organization without making from organization', async () => {
          // TODO
        });
      });
    });
    describe('Negative', () => {

      it.skip('not possible to create direct post as regular post', async () => {
        // TODO
      });

      it.skip('not possible to create media post or post offer as direct post', async () => {
        // TODO
      });

      it.skip('not possible to change entity_id_for and entity_name_for by request', async () => {
        // TODO
      });

      it('It is not possible to create post without token', async () => {

        const res = await request(server)
          .post(postsUrl)
        ;

        ResponseHelper.expectStatusUnauthorized(res);
      });
    });
  });

  describe('Update post', () => {


    describe('Positive', () => {

      describe('Update direct post', () => {
        it('Update direct post for user without organization', async () => {
          const user        = userVlad;
          const targetUser  = userJane;

          const expectedValues = {
            description: 'changed sample description of direct post'
          };

          // noinspection JSDeprecatedSymbols
          const postBefore  = await helpers.Posts.requestToCreateDirectPostForUser(user, targetUser);
          const postAfter   = await helpers.Posts.requestToUpdateDirectPost(postBefore.id, user, expectedValues.description);

          const options = {
            myselfData: true,
            postProcessing: 'full'
          };

          await helpers.Common.checkOnePostForPage(postAfter, options);
          await helpers.Common.checkDirectPostInDb(postAfter, expectedValues, userVlad);
        });

        it('Update direct post for organization without organization', async () => {
          const user          = userVlad;
          const targetOrgId   = 1;

          const expectedValues = {
            description: 'changed sample description of direct post'
          };

          // noinspection JSDeprecatedSymbols
          const postBefore  = await helpers.Posts.requestToCreateDirectPostForOrganization(user, targetOrgId);
          const postAfter   = await helpers.Posts.requestToUpdateDirectPost(postBefore.id, user, expectedValues.description);

          const options = {
            myselfData: true,
            postProcessing: 'full'
          };

          await helpers.Common.checkOnePostForPage(postAfter, options);
          await helpers.Common.checkDirectPostInDb(postAfter, expectedValues, userVlad);
        });
      });

      it('Update Media Post by its author', async () => {
        const userVlad = await helpers.Users.getUserVlad();

        let firstPostBefore = await PostsRepository.findLastMediaPostByAuthor(userVlad.id);
        await helpers.Posts.makeFieldNull(firstPostBefore.id, 'main_image_filename');
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

        helpers.Res.expectStatusOk(res);

        const postAfter = await PostsRepository.findOneByIdAndAuthor(firstPostBefore.id, userVlad.id, true);

        helpers.Posts.validatePatchResponse(res, postAfter);

        helpers.Res.expectValuesAreExpected(fieldsToChange, postAfter);

        expect(postAfter.main_image_filename).toBeDefined();
        await helpers.FileToUpload.isFileUploaded(postAfter.main_image_filename);
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

    describe('Negative', () => {
      it.skip('Direct post. Not possible to change entity_id_for and entity_name_for by request', async () => {
        // TODO
      });

      it('Media post. Not possible to update post by user who is not its author', async () => {
        const postId = await PostsRepository.findLastMediaPostIdByAuthor(userJane.id);

        const res = await request(server)
          .patch(helpers.Req.getOnePostUrl(postId))
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('title', 'Vlad title for Jane post')
        ;

        ResponseHelper.expectStatusNotFound(res);
      });
    });
  });

  describe('User himself posts related activity', () => {
    it('Media post. Should create valid activity record', async () => {
      const user = userVlad;

      // noinspection JSDeprecatedSymbols
      const newPostId      = await helpers.Post.requestToCreateMediaPost(user);
      const activity  = await UsersActivityRepository.findLastByUserIdAndEntityId(userVlad.id, newPostId);
      expect(activity).not.toBeNull();

      const expectedValues = {
        activity_type_id:   ContentTypeDictionary.getTypeMediaPost(), // media post creation
        activity_group_id:  ActivityGroupDictionary.getGroupContentCreation(),
        entity_id_to:       "" + newPostId,
        entity_name:        PostsModelProvider.getEntityName(),
        user_id_from:       user.id
      };

      helpers.Res.expectValuesAreExpected(expectedValues, activity);
    });

    it('Post-offer. Should create valid activity record', async () => {
      const user = userVlad;

      // noinspection JSDeprecatedSymbols
      const newPostId = await helpers.Post.requestToCreatePostOffer(user);
      const activity  = await UsersActivityRepository.findLastByUserIdAndEntityId(userVlad.id, newPostId);
      expect(activity).not.toBeNull();

      const expectedValues = {
        activity_type_id:   ContentTypeDictionary.getTypeOffer(), // media post creation
        activity_group_id:  ActivityGroupDictionary.getGroupContentCreation(),
        entity_id_to:       "" + newPostId,
        entity_name:        PostsModelProvider.getEntityName(),
        user_id_from:       user.id
      };

      helpers.Res.expectValuesAreExpected(expectedValues, activity);
    });
  });

});