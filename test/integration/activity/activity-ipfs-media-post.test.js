const helpers = require('../helpers');
const RabbitMqService = require('../../../lib/jobs/rabbitmq-service');
const delay = require('delay');

const IpfsMetaRepository = require('../../../lib/ipfs/ipfs-meta-repository');
const IpfsApi = require('../../../lib/ipfs/ipfs-api');
const PostRepository = require('../../../lib/posts/posts-repository');

let userVlad;
let userJane;
let userPetr;

describe('IPFS consumer', () => {

  beforeAll(async () => {
    // noinspection JSCheckFunctionSignatures
    [userVlad, userJane, userPetr] = await Promise.all([
      helpers.UserHelper.getUserVlad(),
      helpers.UserHelper.getUserJane(),
      helpers.UserHelper.getUserPetr(),
    ]);
  });

  beforeEach(async () => {
    await helpers.SeedsHelper.initSeeds();
  });

  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  it('should produce, consume and save ipfs meta for Media Post', async () => {
    await RabbitMqService.purgeIpfsQueue();

    const newPostId = await helpers.PostHelper.requestToCreateMediaPost(userVlad);

    let ipfsMeta = null;

    while(!ipfsMeta) {
      ipfsMeta = await IpfsMetaRepository.findAllPostMetaByPostId(newPostId);
      await delay(500);
    }

    expect(ipfsMeta).not.toBeNull();
    expect(ipfsMeta.post_id).toBe(newPostId);

    const newPost = await PostRepository.findOneById(newPostId, null, true);

    const ipfsContent = await IpfsApi.getFileFromIpfs(ipfsMeta.hash);

    const ipfsContentDecoded = JSON.parse(ipfsContent);

    const expectedIpfsValues = {
      'User.account_name': userVlad.account_name,
      'blockchain_id': newPost.blockchain_id,
      'description': newPost.description,
      'id': newPost.id,
      'leading_text': newPost.leading_text,
      'main_image_filename': newPost.main_image_filename,
      'post_type_id': newPost.post_type_id,
      'title': newPost.title,
      'user_id': userVlad.id,
    };

    helpers.ResponseHelper.expectValuesAreExpected(expectedIpfsValues, ipfsContentDecoded);
  }, 10000);

});