const PostRepository = require('../../../lib/posts/posts-repository');
const ActivityProducer = require('../../../lib/jobs/activity-producer');
const IpfsConsumer = require('../../../lib/ipfs/ipfs-consumer');
const helpers = require('../helpers');
const moment = require('moment');
const RabbitMqService = require('../../../lib/jobs/rabbitmq-service');

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
    const post_id = 1;
    const data = await PostRepository.findOneById(post_id, null, true);
    const bindingKey = 'content-creation';

    const jobPayload = PostRepository.getModel().getPayloadForJob(data);
    await RabbitMqService.purgeIpfsQueue();

    await ActivityProducer.publish(jobPayload, bindingKey);

    await IpfsConsumer.consume();

    const ipfsMeta = await IpfsMetaRepository.findAllMetaByPostId(post_id);

    expect(ipfsMeta).not.toBeNull();

    const ipfsMockDataResponse = await IpfsApi.addFileToIpfs('mock-content');
    const ipfsMockData = ipfsMockDataResponse[0];

    const expectedValues = {
      'hash': ipfsMockData.hash,
      'path': ipfsMockData.path,
      'ipfs_size': ipfsMockData.size,
      'ipfs_status': 1,
      'post_id': post_id
    };

    helpers.ResponseHelper.expectValuesAreExpected(expectedValues, ipfsMeta);
  }, 10000);

  it('check that message with post content is placed to the queue', async () => {
    // TODO produce not by test but by code of post creation
    const data = await PostRepository.findOneById(1, null, true);
    const bindingKey = 'content-creation';

    const jobPayload = PostRepository.getModel().getPayloadForJob(data);

    const channel = await RabbitMqService.getChannel();
    await RabbitMqService.purgeIpfsQueue();

    await ActivityProducer.publish(jobPayload, bindingKey);

    const queueAfter = await channel.assertQueue('ipfs');

    expect(queueAfter.messageCount).toBe(1);


    const message = await channel.get('ipfs');
    channel.ack(message);
    const actual = JSON.parse(message.content.toString());

    actual.created_at = moment(actual.created_at).valueOf();
    actual.updated_at = moment(actual.updated_at).valueOf();


    expect(actual).toEqual(JSON.parse(jobPayload));
  }, 10000);
});