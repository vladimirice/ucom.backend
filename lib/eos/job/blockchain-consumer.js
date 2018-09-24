const RabbitMqService = require('../../jobs/rabbitmq-service');
const BlockchainJobProcessor = require('./blockchain-job-processor');
const winston = require('../../../config/winston');

class BlockchainConsumer {
  static async consume() {
    const channel = await RabbitMqService.getChannel();

    const queueName = RabbitMqService.getBlockchainQueueName();
    console.log('Queue will be: ', queueName);

    channel.consume(queueName, async function(message) {
      const messageContent = message.content.toString();
      console.log(" [x] Received %s", messageContent);

      try {
        await BlockchainJobProcessor.process(JSON.parse(messageContent));
        channel.ack(message);
      } catch (err) {
        winston.error(err);
        winston.error('It is not possible to process message ' + JSON.stringify(message));
        winston.error('Message content is: ' + messageContent);
        channel.ack(message);
      }
    }, {noAck: false});
  }
}

module.exports = BlockchainConsumer;