export {};

const gen         = require('../../generators');
const helpers     = require('../helpers');
const tagsHelper  = require('../helpers/tags-helper');
const tagsGenerator = require('../../generators/entity/entity-tags-generator');

const requestHelper = require('../helpers/request-helper');

let userVlad;
let userJane;
let userPetr;

describe('GET Tags', () => {
  beforeAll(async () => {
    helpers.Mock.mockAllTransactionSigning();
    helpers.Mock.mockAllBlockchainJobProducers();
  });
  afterAll(async () => {
    await helpers.SeedsHelper.doAfterAll();
  });
  beforeEach(async () => {
    [userVlad, userJane, userPetr] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  describe('pagination last id is required', () => {
    it('is NOT required for related organizations if page is 1', async () => {
      const tagTitle = 'summer';

      const orgOneId = await gen.Org.createOrgWithoutTeam(userVlad);
      const postId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgOneId, {
        description: `Hi everyone! #${tagTitle} is so close`,
      });

      await tagsHelper.getPostWhenTagsAreProcessed(postId);
      const queryString = requestHelper.getPaginationQueryString(1, 10);

      const url = helpers.Req.getTagsOrgUrl(tagTitle) + queryString;

      await requestHelper.makeGetRequestForList(url);
    });

    it('is required for related organizations if page is more than 1', async () => {
      const tagTitle = 'summer';

      const orgOneId = await gen.Org.createOrgWithoutTeam(userVlad);
      const postId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgOneId, {
        description: `Hi everyone! #${tagTitle} is so close`,
      });
      await tagsHelper.getPostWhenTagsAreProcessed(postId);

      const queryString = requestHelper.getPaginationQueryString(2, 10);
      const url = helpers.Req.getTagsOrgUrl(tagTitle) + queryString;

      await requestHelper.makeGetRequest(url, 400);
    });

    it('last id = string is not correct', async () => {
      const tagTitle = 'summer';

      const orgOneId = await gen.Org.createOrgWithoutTeam(userVlad);
      const postId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgOneId, {
        description: `Hi everyone! #${tagTitle} is so close`,
      });
      await tagsHelper.getPostWhenTagsAreProcessed(postId);

      const queryString = requestHelper.getPaginationQueryString(2, 10);
      const url = `${requestHelper.getTagsOrgUrl(tagTitle)}${queryString}&last_id=hello`;

      await requestHelper.makeGetRequest(url, 400);
    });

    it('last id = float - is not correct', async () => {
      const tagTitle = 'summer';

      const orgOneId = await gen.Org.createOrgWithoutTeam(userVlad);
      const postId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgOneId, {
        description: `Hi everyone! #${tagTitle} is so close`,
      });

      await tagsHelper.getPostWhenTagsAreProcessed(postId);

      const queryString = requestHelper.getPaginationQueryString(2, 10);
      const url = `${requestHelper.getTagsOrgUrl(tagTitle)}${queryString}&last_id=12.06`;

      await requestHelper.makeGetRequest(url, 400);
    });

    it('lets provide correct last id', async () => {
      const tagTitle = 'summer';

      const orgOneId = await gen.Org.createOrgWithoutTeam(userVlad);
      const postId = await gen.Posts.createMediaPostOfOrganization(userVlad, orgOneId, {
        description: `Hi everyone! #${tagTitle} is so close`,
      });

      await tagsHelper.getPostWhenTagsAreProcessed(postId);

      const queryString = requestHelper.getPaginationQueryString(1, 3);
      const url = `${requestHelper.getTagsOrgUrl(tagTitle)}${queryString}&last_id=12`;

      await requestHelper.makeGetRequestForList(url);
    });
  });

  it('Get one tag page by tag name', async () => {
    const generated = await tagsGenerator.createPostsWithTags(userVlad, userJane);

    const tagName = generated.tagsTitles[0];
    const expectedFeedPosts = generated.posts.total_amount;

    const data = await helpers.Tags.requestToGetOneTagPageByTitleAsGuest(tagName);

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

    const options = {
      myselfData: false,
      postProcessing: 'list',
    };

    helpers.Res.expectValidListBody(data.posts);
    helpers.Common.checkPostsListFromApi(data.posts.data, expectedFeedPosts, options);

    helpers.Res.expectValidListBody(data.users);
    helpers.Users.checkManyUsersPreview(data.users.data);

    helpers.Res.expectValidListBody(data.orgs);
    helpers.Organizations.checkOrganizationsPreviewFields(data.orgs.data);
  });

  it('Get tag related organizations', async () => {

    const { postTags, orgIds } = await tagsGenerator.createPostsWithTagsForOrgs(userVlad, userJane);

    const url = helpers.Req.getTagsOrgUrl(postTags[0]);

    const models = await helpers.Req.makeGetRequestForList(url);

    expect(models.length).toBe(3);

    expect(models.some((item): any => item.id === orgIds[0])).toBeTruthy();
    expect(models.some((item): any => item.id === orgIds[1])).toBeTruthy();
    expect(models.some((item): any => item.id === orgIds[3])).toBeTruthy();
    expect(models.some((item): any => item.id === orgIds[2])).toBeFalsy();

    helpers.Organizations.checkOrganizationsPreviewFields(models);
  });

  it('Get tag related users', async () => {
    const postTags = [
      'summer',
      'undefined',
    ];

    const postOneId = await gen.Posts.createMediaPostByUserHimself(userVlad, {
      description: `Hi everyone! #${postTags[0]} is so close`,
    });

    const postTwoId = await gen.Posts.createMediaPostByUserHimself(userVlad, {
      description: `Hi everyone! #${postTags[0]} is so close - here is another description`,
    }); // to test duplications issue

    const postThreeId = await gen.Posts.createMediaPostByUserHimself(userJane, {
      description: `Hi everyone! #${postTags[0]} is so close close close ${postTags[1]}`,
    });

    const postFourId = await gen.Posts.createMediaPostByUserHimself(userPetr, {
      description: `Hi everyone! #${postTags[1]} is so close ha`,
    });

    await Promise.all([
      tagsHelper.getPostWhenTagsAreProcessed(postOneId),
      tagsHelper.getPostWhenTagsAreProcessed(postTwoId),
      tagsHelper.getPostWhenTagsAreProcessed(postThreeId),
      tagsHelper.getPostWhenTagsAreProcessed(postFourId),
    ]);

    const url = `${helpers.Req.getTagsUsersUrl(postTags[0])}/?v2=true`;

    const models = await helpers.Req.makeGetRequestForList(url);

    expect(models.length).toBe(2);

    expect(models.some((item: any) => item.id === userVlad.id)).toBeTruthy();
    expect(models.some((item: any) => item.id === userJane.id)).toBeTruthy();
    expect(models.some((item: any) => item.id === userPetr.id)).toBeFalsy();

    helpers.Users.checkManyUsersPreview(models);
  });

  describe('Smoke tests', () => {
    it('[Smoke] Get one tag page by tag name by myself', async () => {
      const tagTitle: string = 'summer';
      await gen.Entity.Tags.createPostsWithTags(userVlad, userJane);

      await tagsHelper.requestToGetOneTagPageByTitleAsMyself(tagTitle, userVlad);
    });
  });

  describe('Negative', () => {

    it('404 error if no tag with given title', async () => {
      const tagTitle: string = 'summer100500';

      await tagsGenerator.createPostsWithTags(userVlad, userJane);

      await tagsHelper.requestToGetOneTagPageByTitleAsGuest(tagTitle, 404);
    });
  });

  describe('Skipped tests', () => {
    it.skip('[Smoke] fetch org and users data as myself - no errors', async () => {

    });
  });
});
