const helpers = require('../helpers');
const RabbitMqService = require('../../../lib/jobs/rabbitmq-service');
const delay = require('delay');

const IpfsMetaRepository = require('../../../lib/ipfs/ipfs-meta-repository');
const IpfsApi = require('../../../lib/ipfs/ipfs-api');
const PostJobSerializer = require('../../../lib/posts/post-job-serializer');
const PostRepository = require('../../../lib/posts/posts-repository');
const PostOfferRepository = require('../../../lib/posts/repository').PostOffer;
const ContentTypeDictionary = require('uos-app-transaction').ContentTypeDictionary;

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

  describe('IPFS routine', () => {
    it.skip('should produce, consume and save ipfs meta for Media Post', async () => {
      await RabbitMqService.purgeIpfsQueue();

      const newPostId = await helpers.PostHelper.requestToCreateMediaPost(userVlad);

      let ipfsMeta = null;

      while(!ipfsMeta) {
        ipfsMeta = await IpfsMetaRepository.findAllPostMetaByPostId(newPostId);
        await delay(100);
      }

      expect(ipfsMeta).not.toBeNull();
      expect(ipfsMeta.post_id).toBe(newPostId);

      const newPost = await PostRepository.findOneById(newPostId, null, true);

      const ipfsContent = await IpfsApi.getFileFromIpfs(ipfsMeta.hash);

      const ipfsContentDecoded = JSON.parse(ipfsContent);

      const expectedIpfsValues = {
        // 'User.account_name': userVlad.account_name,
        // 'blockchain_id': newPost.blockchain_id,
        'description': newPost.description,
        'id': newPost.id,
        'leading_text': newPost.leading_text,
        // 'main_image_filename': newPost.main_image_filename,
        // 'post_type_id': newPost.post_type_id,
        'title': newPost.title,
        'user_id': userVlad.id,
      };

      helpers.ResponseHelper.expectValuesAreExpected(expectedIpfsValues, ipfsContentDecoded);
    }, 20000)
  });


  describe('Send post updates to IPFS also', () => {
    // Placing to IPFS after updating is disabled

    // it('Send media post updates. Post offer process is the same', async () => {
    //   const post_id = 1;
    //   await helpers.PostHelper.requestSampleMediaPostChange(userVlad, post_id);
    //
    //   let ipfsMeta = null;
    //
    //   while(!ipfsMeta) {
    //     ipfsMeta = await IpfsMetaRepository.findAllPostMetaByPostId(post_id);
    //     await delay(100);
    //   }
    //
    //   expect(ipfsMeta).not.toBeNull();
    //   expect(ipfsMeta.post_id).toBe(post_id);
    //
    //   const newPost = await PostRepository.findOneById(post_id, null, true);
    //
    //   const ipfsContent = await IpfsApi.getFileFromIpfs(ipfsMeta.hash);
    //
    //   const ipfsContentDecoded = JSON.parse(ipfsContent);
    //
    //   const expectedIpfsValues = {
    //     'User.account_name': userVlad.account_name,
    //     'blockchain_id': newPost.blockchain_id,
    //     'description': newPost.description,
    //     'id': newPost.id,
    //     'leading_text': newPost.leading_text,
    //     'main_image_filename': newPost.main_image_filename,
    //     'post_type_id': newPost.post_type_id,
    //     'title': newPost.title,
    //     'user_id': userVlad.id,
    //   };
    //
    //   helpers.ResponseHelper.expectValuesAreExpected(expectedIpfsValues, ipfsContentDecoded);
    // }, 10000);
  });

  describe('Correct post data for IPFS', () => {
    // TODO
    // it('Media Post.', async () => {
    //   // This is actually must be unit test
    //   const newPostId = await helpers.PostHelper.requestToCreateMediaPost(userVlad);
    //
    //   const postJobPayload = {
    //     id: newPostId,
    //     post_type_id: ContentTypeDictionary.getTypeMediaPost(),
    //   };
    //
    //   const data = await PostJobSerializer.getPostDataForIpfs(postJobPayload);
    //
    //   let expectedAttributes = PostRepository.getModel().getMediaPostAttributesForIpfs();
    //
    //   expectedAttributes.push('User.account_name');
    //   helpers.ResponseHelper.expectAllFieldsExistence(data, expectedAttributes);
    // });

    // TODO
    // it('Post Offer', async () => {
    //   // This is actually must be unit test
    //   const newPostId = await helpers.PostHelper.requestToCreatePostOffer(userVlad);
    //
    //   const postJobPayload = {
    //     id: newPostId,
    //     post_type_id: ContentTypeDictionary.getTypeOffer(),
    //   };
    //
    //   const data = await PostJobSerializer.getPostDataForIpfs(postJobPayload);
    //
    //   let expectedAttributes = PostRepository.getModel().getMediaPostAttributesForIpfs();
    //
    //   const expectedPostOfferAttributes = PostOfferRepository.getPostOfferModel().getPostOfferAttributesForIpfs();
    //
    //   expectedPostOfferAttributes.forEach(attribute => {
    //     expectedAttributes.push(`post_offer.${attribute}`);
    //   });
    //
    //   expectedAttributes.push('User.account_name');
    //   helpers.ResponseHelper.expectAllFieldsExistence(data, expectedAttributes);
    // });
  });

  it.skip('should produce, consume and save ipfs meta for Post-Offer', async () => {
    await RabbitMqService.purgeIpfsQueue();

    const newPostId = await helpers.PostHelper.requestToCreatePostOffer(userVlad);

    let ipfsMeta = null;

    while(!ipfsMeta) {
      ipfsMeta = await IpfsMetaRepository.findAllPostMetaByPostId(newPostId);
      await delay(100);
    }

    expect(ipfsMeta).not.toBeNull();
    expect(ipfsMeta.post_id).toBe(newPostId);

    const newPost = await PostRepository.findOneById(newPostId, null, true);

    const ipfsContent = await IpfsApi.getFileFromIpfs(ipfsMeta.hash);

    const ipfsContentDecoded = JSON.parse(ipfsContent);

    const expectedIpfsValues = {
      // 'User.account_name': userVlad.account_name,
      // 'blockchain_id': newPost.blockchain_id,
      'description': newPost.description,
      'id': newPost.id,
      'leading_text': newPost.leading_text,
      // 'main_image_filename': newPost.main_image_filename,
      // 'post_type_id': newPost.post_type_id,
      'title': newPost.title,
      'user_id': userVlad.id,
      // 'post_offer.action_button_title': 'TEST_BUTTON_CONTENT',
      // 'post_offer.action_button_url': null,
      // 'post_offer.action_duration_in_days': null,
    };

    helpers.ResponseHelper.expectValuesAreExpected(expectedIpfsValues, ipfsContentDecoded);
  }, 20000);
});