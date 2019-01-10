export {};

const userHelper = require('../helpers/users-helper');
const seedsHelper = require('../helpers/seeds-helper');
const postRepository = require('./../../../lib/posts/posts-repository');
const postHelper = require('../helpers/posts-helper');

let userVlad;

describe('Posts API', () => {

  beforeAll(async () => {
    [userVlad] = await Promise.all([
      userHelper.getUserVlad(),
      userHelper.getUserJane(),
    ]);
  });

  beforeEach(async () => {
    await seedsHelper.initSeeds();
  });

  afterAll(async () => {
    await seedsHelper.sequelizeAfterAll();
  });

  it('Post author must have correct rating', async () => {
    const expectedRate = await userHelper.setSampleRateToUser(userVlad);

    const post = await postRepository.findLastByAuthor(userVlad.id);
    // const postAndMyself = await PostHelper.getPostByMyself(post.id, userVlad);
    const postWithoutMyself = await postHelper.requestToPost(post.id);

    // expect(postAndMyself['User']['current_rate']).toBe(expectedRate);
    expect(postWithoutMyself['User']['current_rate']).toBe(expectedRate);
  });
});
