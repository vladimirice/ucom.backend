import UsersHelper = require('../helpers/users-helper');
import SeedsHelper = require('../helpers/seeds-helper');
import PostsHelper = require('../helpers/posts-helper');

export {};

const postRepository = require('./../../../lib/posts/posts-repository');

let userVlad;

describe('Posts API', () => {
  beforeAll(async () => {
    [userVlad] = await Promise.all([
      UsersHelper.getUserVlad(),
      UsersHelper.getUserJane(),
    ]);
  });

  beforeEach(async () => {
    await SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await SeedsHelper.sequelizeAfterAll();
  });

  it('Post author must have correct rating', async () => {
    const expectedRate = await UsersHelper.setSampleRateToUser(userVlad);

    const post = await postRepository.findLastByAuthor(userVlad.id);
    // const postAndMyself = await PostHelper.getPostByMyself(post.id, userVlad);
    const postWithoutMyself = await PostsHelper.requestToGetOnePostAsGuest(post.id);

    // expect(postAndMyself['User']['current_rate']).toBe(expectedRate);
    expect(postWithoutMyself.User.current_rate).toBe(expectedRate);
  });
});
