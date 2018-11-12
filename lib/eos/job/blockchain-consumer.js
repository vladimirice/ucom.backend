const RabbitMqService = require('../../jobs/rabbitmq-service');
const BlockchainJobProcessor = require('./blockchain-job-processor');
const {ConsumerLogger} = require('../../../config/winston');
const EosApi = require('../../../lib/eos/eosApi');

class BlockchainConsumer {
  static async consume() {
    const channel = await RabbitMqService.getChannel();
    const queueName = RabbitMqService.getBlockchainQueueName();

    channel.consume(queueName, async function(message) {
      const messageContent = message.content.toString();

      try {
        EosApi.initTransactionFactory();
        await BlockchainJobProcessor.process(JSON.parse(messageContent));
        channel.ack(message);
      } catch (err) {
        ConsumerLogger.error(`It is not possible to process message: ${JSON.stringify(message)}`);
        ConsumerLogger.error(`Message is acked. Message content is: ${messageContent}`);
        channel.ack(message);

        throw err;
      }
    }, {noAck: false});
  }
}

module.exports = BlockchainConsumer;