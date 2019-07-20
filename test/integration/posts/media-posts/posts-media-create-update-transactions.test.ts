import RequestHelper = require('../../helpers/request-helper');
import MockHelper = require('../../helpers/mock-helper');
import SeedsHelper = require('../../helpers/seeds-helper');
import ResponseHelper = require('../../helpers/response-helper');
import PostsHelper = require('../../helpers/posts-helper');
import UsersActivityRepository = require('../../../../lib/users/repository/users-activity-repository');
import PostsGenerator = require('../../../generators/posts-generator');
import PostsCurrentParamsRepository = require('../../../../lib/posts/repository/posts-current-params-repository');

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

const request = require('supertest');

const server = RequestHelper.getApiApplication();

const ActivityGroupDictionary   = require('../../../../lib/activity/activity-group-dictionary');

const postsUrl = RequestHelper.getPostsUrl();

let userVlad;

MockHelper.mockAllBlockchainPart();

const JEST_TIMEOUT = 5000;
// @ts-ignore
const JEST_TIMEOUT_DEBUG = JEST_TIMEOUT * 100;

// #this test cases should be refactored. Use generators, helper-checkers, etc.
describe('Posts API', () => {
  beforeAll(async () => {
    await SeedsHelper.noGraphQlMockBlockchainOnly();
  });
  afterAll(async () => {
    await SeedsHelper.afterAllWithoutGraphQl();
  });
  beforeEach(async () => {
    [userVlad] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Media post creation', () => {
    describe('Positive', () => {
      it('Post current params row should be created during post creation', async () => {
        const postId = await PostsGenerator.createMediaPostByUserHimself(userVlad);

        const data = await PostsCurrentParamsRepository.getCurrentStatsByEntityId(postId);

        PostsHelper.checkOneNewPostCurrentParams(data, true);
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
    });
  });
});

export {};
