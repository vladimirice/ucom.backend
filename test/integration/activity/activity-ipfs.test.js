const PostRepository = require('../../../lib/posts/posts-repository');
const ActivityProducer = require('../../../lib/jobs/activity-producer');
const IpfsConsumer = require('../../../lib/ipfs/ipfs-consumer');
const helpers = require('../helpers');
const moment = require('moment');
const RabbitMqService = require('../../../lib/jobs/rabbitmq-service');

const rabbitMqConfig = require('config')['rabbitmq'];

const open = require('amqplib').connect(rabbitMqConfig['connection_string']);


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


  it('playground', async () => {

    const wrapper = await channelWrapper.getChannel();

    await wrapper._channel.purgeQueue('rxQueueName');

    await wrapper.sendToQueue('rxQueueName', {hello: 'world'});


    // const message = 'hello';
    // await channelWrapper.publish('activity', 'content-creation', new Buffer(message));

    // channelWrapper.sendTo('ipfs', {hello: 'world'})
    //   .then(function() {
    //     return console.log("Message was sent!  Hooray!");
    //   }).catch(function(err) {
    //   return console.log("Message was rejected...  Boo!");
    // });
    // RabbitMqService
  });


  it('should consume message properly', async () => {
    // Push message to queue
    // run consumer
    // check that consumer related job is done

    // Convert it to integration test
    // Check consumer work

    const data = await PostRepository.findOneById(1, null, true);
    const bindingKey = 'content-creation';

    const jobPayload = PostRepository.getModel().getPayloadForJob(data);

    await ActivityProducer.publish(jobPayload, bindingKey);

    await IpfsConsumer.consume(true);
  });

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