const PostRepository = require('../../../lib/posts/posts-repository');
const ActivityProducer = require('../../../lib/jobs/activity-producer');
const IpfsConsumer = require('../../../lib/ipfs/ipfs-consumer');
const helpers = require('../helpers');
const moment = require('moment');
const RabbitMqService = require('../../../lib/jobs/rabbitmq-service');
const delay = require('delay');

const IpfsMetaRepository = require('../../../lib/ipfs/ipfs-meta-repository');
const IpfsApi = require('../../../lib/ipfs/ipfs-api');

jest.mock('../../../lib/ipfs/ipfs-api');

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

  it('should consume message properly', async () => {
    const channel = await RabbitMqService.getChannel();
    await RabbitMqService.purgeIpfsQueue();

    const newPostId = await helpers.PostHelper.requestToCreateMediaPost(userVlad);

    let ipfsMeta = null;

    while(!ipfsMeta) {
      ipfsMeta = await IpfsMetaRepository.findAllMetaByPostId(newPostId);
      await delay(500);
    }

    expect(ipfsMeta).not.toBeNull();

    const ipfsMockDataResponse = await IpfsApi.addFileToIpfs('mock-content');
    const ipfsMockData = ipfsMockDataResponse[0];

    const expectedValues = {
      'hash': ipfsMockData.hash,
      'path': ipfsMockData.path,
      'ipfs_size': ipfsMockData.size,
      'ipfs_status': 1,
      'post_id': newPostId
    };

    helpers.ResponseHelper.expectValuesAreExpected(expectedValues, ipfsMeta);
  }, 10000);

  // it('check that message with post content is placed to the queue', async () => {
  //   const channel = await RabbitMqService.getChannel();
  //   await RabbitMqService.purgeIpfsQueue();
  //
  //   const newPostId = await helpers.PostHelper.requestToCreateMediaPost(userVlad);
  //
  //   // return;
  //
  //   const queueAfter = await channel.assertQueue(RabbitMqService.getIpfsQueueName());
  //   expect(queueAfter.messageCount).toBe(1);
  //
  //   const message = await channel.get(RabbitMqService.getIpfsQueueName());
  //   channel.ack(message);
  //   const actual = JSON.parse(message.content.toString());
  //
  //   actual.created_at = moment(actual.created_at).valueOf();
  //   actual.updated_at = moment(actual.updated_at).valueOf();
  //
  //   const newPost = await PostRepository.findOneById(newPostId, null, true);
  //
  //   const jobPayload = await PostRepository.getModel().getPayloadForJob(newPost);
  //
  //   expect(actual).toEqual(JSON.parse(jobPayload));
  // }, 10000);
});