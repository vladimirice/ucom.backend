const helpers = require('../helpers');

const userHelper = require('../helpers/users-helper');

const seedsHelper = require('../helpers/seeds-helper');
const postRepository = require('../../../lib/posts/posts-repository');

let userVlad;
let userJane;

helpers.Mock.mockAllTransactionSigning();

describe('Activity redlock', () => {
  beforeEach(async () => { await seedsHelper.initSeeds(); });
  afterAll(async () => { await seedsHelper.sequelizeAfterAll(); });

  beforeAll(async () => {
    [userVlad, userJane] = await Promise.all([
      userHelper.getUserVlad(),
      userHelper.getUserJane(),
    ]);
  });

  it('Not possible to send two upvote requests in parallel', async () => {
    const targetUserId = userJane.id;
    const postIdToUpvote = await postRepository.findFirstMediaPostIdUserId(targetUserId);

    const promises = [
      helpers.Posts.requestToUpvotePost(userVlad, postIdToUpvote, false),
      helpers.Posts.requestToUpvotePost(userVlad, postIdToUpvote, false),
    ];

    const responses = await Promise.all(promises);
    const errorResponse = responses.find(item => !!item.errors);

    expect(errorResponse).toBeDefined();
    expect(errorResponse.errors.general).toMatch(
      'You already have an action request. Please wait until it is finished.',
    );
  });

  it('[Smoke] After successful response redis lock should be released', async () => {
    const targetUserId = userJane.id;

    const postId = await postRepository.findFirstMediaPostIdUserId(targetUserId);

    await helpers.Posts.requestToUpvotePost(userVlad, postId);
    const responseTwo = await helpers.Posts.requestToUpvotePost(userVlad, postId, false);

    expect(responseTwo.errors).toBeDefined();
    expect(responseTwo.errors.general).toMatch('Vote duplication is not allowed');
  }, 10000);
});

export {};
