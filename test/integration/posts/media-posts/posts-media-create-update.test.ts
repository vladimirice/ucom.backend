import RequestHelper = require('../../helpers/request-helper');
import MockHelper = require('../../helpers/mock-helper');
import SeedsHelper = require('../../helpers/seeds-helper');
import ResponseHelper = require('../../helpers/response-helper');
import PostsRepository = require('../../../../lib/posts/posts-repository');
import PostOfferRepository = require('../../../../lib/posts/repository/post-offer-repository');
import PostsHelper = require('../../helpers/posts-helper');
import UsersActivityRepository = require('../../../../lib/users/repository/users-activity-repository');
import PostStatsRepository = require('../../../../lib/posts/stats/post-stats-repository');
import PostsGenerator = require('../../../generators/posts-generator');
import UsersModelProvider = require('../../../../lib/users/users-model-provider');
import PostsModelProvider = require('../../../../lib/posts/service/posts-model-provider');
import PostsCurrentParamsRepository = require('../../../../lib/posts/repository/posts-current-params-repository');

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

const request = require('supertest');
const server = require('../../../../app');

const ActivityGroupDictionary   = require('../../../../lib/activity/activity-group-dictionary');

const PostsService            = require('./../../../../lib/posts/post-service');

const postOfferUrl  = RequestHelper.getPostsUrl();
const rootUrl       = RequestHelper.getPostsUrl();
const postsUrl      = RequestHelper.getPostsUrl();

let userVlad;
let userJane;

MockHelper.mockAllBlockchainPart();

// #this test cases should be refactored. Use generators, helper-checkers, etc.
describe('Posts API', () => {
  beforeAll(async () => {
    await SeedsHelper.noGraphQlMockBlockchainOnly();
  });
  afterAll(async () => {
    await SeedsHelper.afterAllWithoutGraphQl();
  });
  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Media post creation', () => {
    describe('Positive', () => {
      it('Post current params row should be created during post creation', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

        const data = await PostsCurrentParamsRepository.getCurrentStatsByEntityId(postId);

        PostsHelper.checkOneNewPostCurrentParams(data, true);
      });

      it('Create media post', async () => {
        const myself = userVlad;

        const newPostFields = {
          title: 'Extremely new post',
          description: 'Our super post description',
          leading_text: 'extremely leading text',
          post_type_id: ContentTypeDictionary.getTypeMediaPost(),
          user_id: myself.id,
          current_rate: 0,
          current_vote: 0,
        };

        const res = await request(server)
          .post(postsUrl)
          .set('Authorization', `Bearer ${myself.token}`)
          .field('title', newPostFields.title)
          .field('description', newPostFields.description)
          .field('post_type_id', newPostFields.post_type_id)
          .field('leading_text', newPostFields.leading_text)
          .field('entity_images', '{}')
        ;

        ResponseHelper.expectStatusOk(res);

        const posts = await PostsRepository.findAllByAuthor(myself.id);
        const newPost = posts.find(data => data.title === newPostFields.title);
        expect(newPost).toBeDefined();

        const { body } = res;

        expect(body.id).toBe(newPost.id);

        const postStatsModel = await PostStatsRepository.findOneByPostId(newPost.id, true);
        expect(postStatsModel).toBeDefined();

        expect(postStatsModel.comments_count).toBe(0);

        await PostsHelper.expectPostDbValues(newPost, {
          entity_id_for:    `${myself.id}`,
          entity_name_for:  UsersModelProvider.getEntityName(),
        });

        PostsHelper.checkEntityImages(newPost);
      });
    });

    describe('Negative', () => {
      it('bad request error if title too long', async () => {
        const myself = userVlad;

        const title = RequestHelper.makeRandomString(256);

        const newPostFields = {
          title,
          description: 'Our super post description',
          leading_text: 'extremely leading text',
          post_type_id: ContentTypeDictionary.getTypeMediaPost(),
          user_id: myself.id,
        };

        const res = await request(server)
          .post(postsUrl)
          .set('Authorization', `Bearer ${myself.token}`)
          .field('title', newPostFields.title)
          .field('description', newPostFields.description)
          .field('post_type_id', newPostFields.post_type_id)
          .field('leading_text', newPostFields.leading_text)
        ;

        ResponseHelper.expectStatusBadRequest(res);
      });
      it('bad request error if leading_text is too long', async () => {
        const myself = userVlad;

        const leadingText = RequestHelper.makeRandomString(256);

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
          .field('title', newPostFields.title)
          .field('description', newPostFields.description)
          .field('post_type_id', newPostFields.post_type_id)
          .field('leading_text', newPostFields.leading_text)
        ;

        ResponseHelper.expectStatusBadRequest(res);
      });

      it('It is not possible to create post without token', async () => {
        const res = await request(server)
          .post(postsUrl)
        ;

        ResponseHelper.expectStatusUnauthorized(res);
      });
    });
  });

  describe('Media post updating', () => {
    describe('Positive', () => {
      it('Media Post updating should lead to updating activity', async () => {
        await SeedsHelper.initUsersOnly(); // this means that seeds are not used in this autotest

        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

        const fieldsToChange = {
          title: 'This is title to change',
          description: 'Also necessary to change description',
          leading_text: 'And leading text',
        };

        const res = await request(server)
          .patch(`${postsUrl}/${postId}`)
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('title',         fieldsToChange.title)
          .field('description',   fieldsToChange.description)
          .field('leading_text',  fieldsToChange.leading_text)
          .field('entity_images',  '{}')
        ;

        ResponseHelper.expectStatusOk(res);

        // expect required users activity
        const activity  =
          await UsersActivityRepository.findLastByUserIdAndEntityId(userVlad.id, postId);
        // expect this is updating

        expect(activity.activity_group_id).toBe(ActivityGroupDictionary.getGroupContentUpdating());
        expect(activity.activity_type_id).toBe(ContentTypeDictionary.getTypeMediaPost());
        expect(activity.event_id).toBeNull();
      });

      it('Update Media Post by its author', async () => {
        await PostsGenerator.createMediaPostByUserHimself(userVlad);

        const firstPostBefore = await PostsRepository.findLastMediaPostByAuthor(userVlad.id);

        const fieldsToChange = {
          title: 'This is title to change',
          description: 'Also necessary to change description',
          leading_text: 'And leading text',
        };

        const res = await request(server)
          .patch(`${postsUrl}/${firstPostBefore.id}`)
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('title',         fieldsToChange.title)
          .field('description',   fieldsToChange.description)
          .field('leading_text',  fieldsToChange.leading_text)
          .field('entity_images',  '{}')
        ;

        ResponseHelper.expectStatusOk(res);

        const postAfter =
          await PostsRepository.findOneByIdAndAuthor(firstPostBefore.id, userVlad.id, true);

        PostsHelper.validatePatchResponse(res, postAfter);

        ResponseHelper.expectValuesAreExpected(fieldsToChange, postAfter);

        PostsHelper.checkEntityImages(postAfter);
      });
    });

    describe('Negative', () => {
      it('Media post. Not possible to update post by user who is not its author', async () => {
        await PostsGenerator.createMediaPostByUserHimself(userJane);
        const postId = await PostsRepository.findLastMediaPostIdByAuthor(userJane.id);

        const res = await request(server)
          .patch(RequestHelper.getOnePostUrl(postId))
          .set('Authorization', `Bearer ${userVlad.token}`)
          .field('title', 'Vlad title for Jane post')
        ;

        ResponseHelper.expectStatusBadRequest(res);
      });
    });
  });

  describe('User himself posts related activity', () => {
    it('Media post. Should create valid activity record', async () => {
      const user = userVlad;

      const newPostId = await PostsGenerator.createMediaPostByUserHimself(user);
      const activity =
        await UsersActivityRepository.findLastByUserIdAndEntityId(userVlad.id, newPostId);
      expect(activity).not.toBeNull();

      const expectedValues = {
        activity_type_id:   ContentTypeDictionary.getTypeMediaPost(), // media post creation
        activity_group_id:  ActivityGroupDictionary.getGroupContentCreation(),
        entity_id_to:       `${newPostId}`,
        entity_name:        PostsModelProvider.getEntityName(),
        user_id_from:       user.id,
      };

      ResponseHelper.expectValuesAreExpected(expectedValues, activity);
    });
  });

  describe('Sanitizing', () => {
    it('should preserve images', async () => {
      const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

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
        .patch(RequestHelper.getOnePostUrl(postId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description',   fieldsToChange.description)
        .field('entity_images',   '{}')
      ;

      ResponseHelper.expectStatusOk(res);

      const updatedPostId = res.body.post_id;

      const updatedPost = await PostsRepository.findOnlyPostItselfById(updatedPostId);

      expect(updatedPost.description).toBe(fieldsToChange.description);
    });

    it('Should preserve iframe and attributes', async () => {
      const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

      // noinspection HtmlDeprecatedAttribute
      const fieldsToChange = {
        description :
          `<div class="medium-insert-embeds">
 <figure>
  <div class="medium-insert-embed">
   <div><div style="left:0;width:100%;height:0;position:relative;padding-bottom:56.2493%;"><iframe src="https://www.youtube.com/embed/FYNsYz-nOsI?feature=oembed" style="border:0;top:0;left:0;width:100%;height:100%;position:absolute;" allowfullscreen scrolling="no"></iframe></div></div>
  </div>
 </figure>

</div><p class="12345">a</p>`,
      };

      const res = await request(server)
        .patch(RequestHelper.getOnePostUrl(postId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('description',   fieldsToChange.description)
        .field('entity_images',   '{}')
      ;

      ResponseHelper.expectStatusOk(res);

      const updatedPostId = res.body.post_id;

      const updatedPost = await PostsRepository.findOnlyPostItselfById(updatedPostId);

      expect(updatedPost.description).toBe(fieldsToChange.description);
    });

    it('should sanitize post text fields', async () => {
      const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

      const fieldsToChange = {
        title: '<script>alert("hello world!")</script><p>Html content</p> Simple text',
        leading_text: '<script>alert("hello world!")</script><p>Html content</p> Simple text',
        description: '<script>alert("hello world!")</script><p>Html text</p>',
      };

      const res = await request(server)
        .patch(RequestHelper.getOnePostUrl(postId))
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('title',         fieldsToChange.title)
        .field('description',   fieldsToChange.description)
        .field('leading_text',  fieldsToChange.leading_text)
        .field('entity_images',  '{}')
      ;

      ResponseHelper.expectStatusOk(res);

      const updatedPostId = res.body.post_id;

      const updatedPost = await PostsRepository.findOnlyPostItselfById(updatedPostId);

      expect(updatedPost.title).toBe('Html content Simple text');
      expect(updatedPost.leading_text).toBe('Html content Simple text');
      expect(updatedPost.description).toBe('<p>Html text</p>');
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
        .field('title', newPostFields.title)
        .field('description', newPostFields.description)
        .field('leading_text', newPostFields.leading_text)
        .field('post_type_id', newPostFields.post_type_id)
        .field('action_button_title', newPostOfferFields.action_button_title)
        .field('post_users_team[]', '') // this is to catch and fix bug by TDD
      ;

      ResponseHelper.expectStatusOk(res);

      const lastPost = await PostsService.findLastPostOfferByAuthor(userVlad.id);
      ResponseHelper.expectNotEmpty(lastPost);
      expect(lastPost.post_offer).not.toBeNull();

      expect(res.body.id).toBe(lastPost.id);
      PostsHelper.validateDbEntity(newPostFields, lastPost);

      // @ts-ignore
      newPostOfferFields.post_id = res.body.id;
      PostsHelper.validateDbEntity(newPostOfferFields, lastPost.post_offer);

      const postUsersTeam = lastPost.post_users_team;
      expect(postUsersTeam).toBeDefined();
      expect(postUsersTeam.length).toBe(0);

      const postStats = await PostStatsRepository.findOneByPostId(lastPost.id, true);

      expect(postStats).not.toBeNull();

      // UPDATE only button
      const fieldsPostOfferToChange = {
        action_button_title: 'FOOBAR',
      };

      const patchRes = await request(server)
        .patch(`${rootUrl}/${lastPost.id}`)
        .set('Authorization', `Bearer ${userVlad.token}`)
        .field('action_button_title',  fieldsPostOfferToChange.action_button_title)
        .field('post_users_team[]', '') // this is to catch and fix bug by TDD
      ;

      ResponseHelper.expectStatusOk(patchRes);

      const firstPostAfter = await PostOfferRepository.findOneById(lastPost.id, true);
      expect(firstPostAfter.post_offer.action_button_title)
        .toBe(fieldsPostOfferToChange.action_button_title);

      await PostsHelper.expectPostDbValues(lastPost, {
        entity_id_for:    `${userVlad.id}`,
        entity_name_for:  UsersModelProvider.getEntityName(),
      });
    });
    it.skip('Post-offer. Should create valid activity record', async () => {
      const user = userVlad;

      const newPostId = await PostsGenerator.createPostOfferByUserHimself(user);
      const activity  = await UsersActivityRepository.findLastByUserIdAndEntityId(
        userVlad.id,
        newPostId,
      );
      expect(activity).not.toBeNull();

      const expectedValues = {
        activity_type_id:   ContentTypeDictionary.getTypeOffer(), // media post creation
        activity_group_id:  ActivityGroupDictionary.getGroupContentCreation(),
        entity_id_to:       `${newPostId}`,
        entity_name:        PostsModelProvider.getEntityName(),
        user_id_from:       user.id,
      };

      ResponseHelper.expectValuesAreExpected(expectedValues, activity);
    });
    it.skip('Update post-offer by its author', async () => {
      const firstPostBefore = await PostsService.findLastPostOfferByAuthor(userVlad.id);

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
        .field('leading_text',  fieldsToChange.leading_text)
        .field('action_button_title',  fieldsPostOfferToChange.action_button_title)
        .field('post_users_team[0][id]', boardToChange[0].user_id)
      ;

      ResponseHelper.expectStatusOk(res);

      const firstPostAfter = await PostOfferRepository.findOneById(firstPostBefore.id, true);

      ResponseHelper.expectValuesAreExpected(fieldsToChange, firstPostAfter);
      ResponseHelper.expectValuesAreExpected(fieldsPostOfferToChange, firstPostAfter.post_offer);

      const postUsersTeam = firstPostAfter.post_users_team;
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
    it.skip('Create post-offer with board', async () => {
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
        .field('title', newPostFields.title)
        .field('description', newPostFields.description)
        .field('leading_text', newPostFields.leading_text)
        .field('post_type_id', newPostFields.post_type_id)
        .field('action_button_title', newPostOfferFields.action_button_title)
        .field('action_button_url', newPostOfferFields.action_button_url)
        .field('action_duration_in_days', newPostOfferFields.action_duration_in_days)
        .field('post_users_team[0][id]', newPostUsersTeamFields[0].user_id)
        .field('post_users_team[1][id]', newPostUsersTeamFields[1].user_id)
      ;

      ResponseHelper.expectStatusOk(res);

      const lastPost = await PostsService.findLastPostOfferByAuthor(userVlad.id);
      ResponseHelper.expectNotEmpty(lastPost);
      expect(lastPost.post_offer).not.toBeNull();

      expect(res.body.id).toBe(lastPost.id);
      PostsHelper.validateDbEntity(newPostFields, lastPost);

      // @ts-ignore
      newPostOfferFields.post_id = res.body.id;
      PostsHelper.validateDbEntity(newPostOfferFields, lastPost.post_offer);

      const postUsersTeam = lastPost.post_users_team;
      expect(postUsersTeam).toBeDefined();
      newPostUsersTeamFields.forEach((teamMember) => {
        const record = postUsersTeam.find(data => data.user_id === teamMember.user_id);
        expect(record).toBeDefined();
        expect(record.post_id).toBe(lastPost.id);
      });

      await PostsHelper.expectPostDbValues(lastPost, {
        entity_id_for:    `${userVlad.id}`,
        entity_name_for:  UsersModelProvider.getEntityName(),
      });
    });
    it.skip('For other organization without making from organization', async () => {
    });
  });
});

export {};
