import { EntityNames } from 'ucom.libs.common';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { DbTag } from '../../../lib/tags/interfaces/dto-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import OrganizationsGenerator = require('../../generators/organizations-generator');
import PostsGenerator = require('../../generators/posts-generator');
import TagsHelper = require('../helpers/tags-helper');
import RequestHelper = require('../helpers/request-helper');
import EntityTagsGenerator = require('../../generators/entity/entity-tags-generator');
import ResponseHelper = require('../helpers/response-helper');
import UsersHelper = require('../helpers/users-helper');
import CommonHelper = require('../helpers/common-helper');
import OrganizationsHelper = require('../helpers/organizations-helper');

import knex = require('../../../config/knex');
import UsersModelProvider = require('../../../lib/users/users-model-provider');
import CommonChecker = require('../../helpers/common/common-checker');

let userVlad: UserModel;
let userJane: UserModel;
let userPetr: UserModel;

const options = {
  isGraphQl: false,
  workersMocking: 'blockchainOnly',
};

const JEST_TIMEOUT = 5000;

describe('GET Tags', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(options); });
  afterAll(async () => { await SeedsHelper.doAfterAll(options); });
  beforeEach(async () => {
    [userVlad, userJane, userPetr] = await SeedsHelper.beforeAllRoutineMockAccountsProperties();
  });

  describe('One tag view', () => {
    let tag: DbTag;
    beforeEach(async () => {
      tag = await EntityTagsGenerator.createTagViaNewPostAndGetTag(userVlad, 'summer');
    });

    it('should create a new record inside users activity views - from logged user', async () => {
      await TagsHelper.requestToGetOneTagPageByTitleAsMyself(tag.title, userVlad);

      const record = await knex(UsersModelProvider.getUsersActivityEventsViewTableName())
        .where({
          user_id:      userVlad.id,
          entity_id:    tag.id,
          entity_name:  EntityNames.TAGS,
        });

      CommonChecker.expectNotEmpty(record);
    }, JEST_TIMEOUT);

    it('should create a new record inside users activity views - from guest user', async () => {
      await TagsHelper.requestToGetOneTagPageByTitleAsGuest(tag.title);

      const record = await knex(UsersModelProvider.getUsersActivityEventsViewTableName())
        .where({
          user_id:      null,
          entity_id:    tag.id,
          entity_name:  EntityNames.TAGS,
        });

      CommonChecker.expectNotEmpty(record);
    }, JEST_TIMEOUT);

    it('should contain number of views - both for logged views and guest views', async () => {
      await TagsHelper.requestToGetOneTagPageByTitleAsGuest(tag.title);
      const tagResponse = await TagsHelper.requestToGetOneTagPageByTitleAsMyself(tag.title, userVlad);

      expect(tagResponse.views_count).toBeDefined();
      expect(tagResponse.views_count).toBe(2);
    });
  });

  describe('pagination last id is required', () => {
    it('is NOT required for related organizations if page is 1', async () => {
      const tagTitle = 'summer';

      const orgOneId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
      const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgOneId, {
        description: `Hi everyone! #${tagTitle} is so close`,
      });

      await TagsHelper.getPostWhenTagsAreProcessed(postId);
      const queryString = RequestHelper.getPaginationQueryString(1, 10);

      const url = RequestHelper.getTagsOrgUrl(tagTitle) + queryString;

      await RequestHelper.makeGetRequestForList(url);
    });

    it('is required for related organizations if page is more than 1', async () => {
      const tagTitle = 'summer';

      const orgOneId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
      const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgOneId, {
        description: `Hi everyone! #${tagTitle} is so close`,
      });
      await TagsHelper.getPostWhenTagsAreProcessed(postId);

      const queryString = RequestHelper.getPaginationQueryString(2, 10);
      const url = RequestHelper.getTagsOrgUrl(tagTitle) + queryString;

      await RequestHelper.makeGetRequest(url, 400);
    });

    it('last id = string is not correct', async () => {
      const tagTitle = 'summer';

      const orgOneId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
      const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgOneId, {
        description: `Hi everyone! #${tagTitle} is so close`,
      });
      await TagsHelper.getPostWhenTagsAreProcessed(postId);

      const queryString = RequestHelper.getPaginationQueryString(2, 10);
      const url = `${RequestHelper.getTagsOrgUrl(tagTitle)}${queryString}&last_id=hello`;

      await RequestHelper.makeGetRequest(url, 400);
    });

    it('last id = float - is not correct', async () => {
      const tagTitle = 'summer';

      const orgOneId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
      const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgOneId, {
        description: `Hi everyone! #${tagTitle} is so close`,
      });

      await TagsHelper.getPostWhenTagsAreProcessed(postId);

      const queryString = RequestHelper.getPaginationQueryString(2, 10);
      const url = `${RequestHelper.getTagsOrgUrl(tagTitle)}${queryString}&last_id=12.06`;

      await RequestHelper.makeGetRequest(url, 400);
    });

    it('lets provide correct last id', async () => {
      const tagTitle = 'summer';

      const orgOneId = await OrganizationsGenerator.createOrgWithoutTeam(userVlad);
      const postId = await PostsGenerator.createMediaPostOfOrganization(userVlad, orgOneId, {
        description: `Hi everyone! #${tagTitle} is so close`,
      });

      await TagsHelper.getPostWhenTagsAreProcessed(postId);

      const queryString = RequestHelper.getPaginationQueryString(1, 3);
      const url = `${RequestHelper.getTagsOrgUrl(tagTitle)}${queryString}&last_id=12`;

      await RequestHelper.makeGetRequestForList(url);
    });
  });

  it('Get one tag page by tag name', async () => {
    const generated = await EntityTagsGenerator.createPostsWithTags(userVlad, userJane);

    const tagName = generated.tagsTitles[0];
    const expectedFeedPosts = generated.posts.total_amount;

    const data = await TagsHelper.requestToGetOneTagPageByTitleAsGuest(tagName);

    expect(data.posts).toBeDefined();
    expect(data.users).toBeDefined();
    expect(data.orgs).toBeDefined();

    expect(typeof data.id).toBe('number');
    expect(data.id).toBeGreaterThan(0);

    expect(typeof data.title).toBe('string');
    expect(data.title.length).toBeGreaterThan(0);

    expect(typeof data.created_at).toBe('string');
    expect(data.created_at.length).toBeGreaterThan(0);

    expect(typeof data.current_rate).toBe('number');
    expect(data.created_at.length).toBeGreaterThanOrEqual(0);

    const checkerOptions = {
      myselfData: false,
      postProcessing: 'list',
      ...UsersHelper.propsAndCurrentParamsOptions(false),
    };

    ResponseHelper.expectValidListBody(data.posts);
    CommonHelper.checkPostsListFromApi(data.posts.data, expectedFeedPosts, checkerOptions);

    ResponseHelper.expectValidListBody(data.users);
    UsersHelper.checkManyUsersPreview(data.users.data, checkerOptions);

    ResponseHelper.expectValidListBody(data.orgs);
    OrganizationsHelper.checkOrganizationsPreviewFields(data.orgs.data);
  });

  it('Get tag related organizations', async () => {
    const { postTags, orgIds } =
      await EntityTagsGenerator.createPostsWithTagsForOrgs(userVlad, userJane);

    const url = RequestHelper.getTagsOrgUrl(postTags[0]);

    const models = await RequestHelper.makeGetRequestForList(url);

    expect(models.length).toBe(3);

    expect(models.some((item): any => item.id === orgIds[0])).toBeTruthy();
    expect(models.some((item): any => item.id === orgIds[1])).toBeTruthy();
    expect(models.some((item): any => item.id === orgIds[3])).toBeTruthy();
    expect(models.some((item): any => item.id === orgIds[2])).toBeFalsy();

    OrganizationsHelper.checkOrganizationsPreviewFields(models);
  });

  it('Get tag related users', async () => {
    const postTags = [
      'summer',
      'undefined',
    ];

    const postOneId = await PostsGenerator.createMediaPostByUserHimself(userVlad, {
      description: `Hi everyone! #${postTags[0]} is so close`,
    });

    const postTwoId = await PostsGenerator.createMediaPostByUserHimself(userVlad, {
      description: `Hi everyone! #${postTags[0]} is so close - here is another description`,
    }); // to test duplications issue

    const postThreeId = await PostsGenerator.createMediaPostByUserHimself(userJane, {
      description: `Hi everyone! #${postTags[0]} is so close close close ${postTags[1]}`,
    });

    const postFourId = await PostsGenerator.createMediaPostByUserHimself(userPetr, {
      description: `Hi everyone! #${postTags[1]} is so close ha`,
    });

    await Promise.all([
      TagsHelper.getPostWhenTagsAreProcessed(postOneId),
      TagsHelper.getPostWhenTagsAreProcessed(postTwoId),
      TagsHelper.getPostWhenTagsAreProcessed(postThreeId),
      TagsHelper.getPostWhenTagsAreProcessed(postFourId),
    ]);

    const url = `${RequestHelper.getTagsUsersUrl(postTags[0])}/?v2=true`;

    const models = await RequestHelper.makeGetRequestForList(url);

    expect(models.length).toBe(2);

    expect(models.some((item: any) => item.id === userVlad.id)).toBeTruthy();
    expect(models.some((item: any) => item.id === userJane.id)).toBeTruthy();
    expect(models.some((item: any) => item.id === userPetr.id)).toBeFalsy();

    UsersHelper.checkManyUsersPreview(models, UsersHelper.propsAndCurrentParamsOptions(false));
  });

  describe('Smoke tests', () => {
    it('[Smoke] Get one tag page by tag name by myself', async () => {
      const tagTitle: string = 'summer';
      await EntityTagsGenerator.createPostsWithTags(userVlad, userJane);

      await TagsHelper.requestToGetOneTagPageByTitleAsMyself(tagTitle, userVlad);
    });
  });

  describe('Negative', () => {
    it('404 error if no tag with given title', async () => {
      const tagTitle: string = 'summer100500';

      await EntityTagsGenerator.createPostsWithTags(userVlad, userJane);

      await TagsHelper.requestToGetOneTagPageByTitleAsGuest(tagTitle, 404);
    });
  });

  describe('Skipped tests', () => {
    it.skip('[Smoke] fetch org and users data as myself - no errors', async () => {

    });
  });
});

export {};
