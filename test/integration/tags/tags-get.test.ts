export {};

const gen         = require('../../generators');
const helpers     = require('../helpers');
const tagsHelper  = require('../helpers/tags-helper');
const tagsGenerator = require('../../generators/entity/entity-tags-generator');

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
    const orgOneId    = await gen.Org.createOrgWithoutTeam(userVlad);
    const orgTwoId    = await gen.Org.createOrgWithoutTeam(userJane);
    const orgThreeId  = await gen.Org.createOrgWithoutTeam(userVlad);

    const postTags = [
      'summer',
      'undefined',
    ];

    await gen.Posts.createMediaPostOfOrganization(userVlad, orgOneId, {
      description: `Hi everyone! #${postTags[0]} is so close`,
    });

    await gen.Posts.createMediaPostOfOrganization(userVlad, orgOneId, {
      description: `Hi everyone! #${postTags[0]} is so close close close ${postTags[1]}`,
    });

    await gen.Posts.createMediaPostOfOrganization(userJane, orgTwoId, {
      description: `Hi everyone! #${postTags[0]} is so close ha`,
    });

    await gen.Posts.createMediaPostOfOrganization(userVlad, orgThreeId, {
      description: `Hi everyone! #${postTags[1]} is so close`,
    });

    const url = helpers.Req.getTagsOrgUrl(postTags[0]);

    const models = await helpers.Req.makeGetRequestForList(url);

    expect(models.length).toBe(2);

    expect(models.some((item): any => item.id === orgOneId)).toBeTruthy();
    expect(models.some((item): any => item.id === orgTwoId)).toBeTruthy();
    expect(models.some((item): any => item.id === orgThreeId)).toBeFalsy();

    helpers.Organizations.checkOrganizationsPreviewFields(models);
  });

  it('Get tag related users', async () => {
    const postTags = [
      'summer',
      'undefined',
    ];

    await gen.Posts.createMediaPostByUserHimself(userVlad, {
      description: `Hi everyone! #${postTags[0]} is so close`,
    });

    await gen.Posts.createMediaPostByUserHimself(userVlad, {
      description: `Hi everyone! #${postTags[0]} is so close - here is another description`,
    }); // to test duplications issue

    await gen.Posts.createMediaPostByUserHimself(userJane, {
      description: `Hi everyone! #${postTags[0]} is so close close close ${postTags[1]}`,
    });

    await gen.Posts.createMediaPostByUserHimself(userPetr, {
      description: `Hi everyone! #${postTags[1]} is so close ha`,
    });

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
