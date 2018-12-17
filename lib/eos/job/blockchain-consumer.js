const RabbitMqService = require('../../jobs/rabbitmq-service');
const BlockchainJobProcessor = require('./blockchain-job-processor');
const {ConsumerLogger} = require('../../../config/winston');
const EosApi = require('../../../lib/eos/eosApi');

const UsersActivityRepository = require('../../users/repository').Activity;

class BlockchainConsumer {
  static async consume() {
    const channel = await RabbitMqService.getChannel();
    const queueName = RabbitMqService.getBlockchainQueueName();

    channel.consume(queueName, async function(message) {

      let messageContent;
      let parsedMessageContent;

      try {
        messageContent        = message.content.toString();
        parsedMessageContent  = JSON.parse(messageContent);

        EosApi.initTransactionFactory();
        await BlockchainJobProcessor.process(parsedMessageContent);
      } catch (err) {
        const userIdFrom = await UsersActivityRepository.getUserIdFromByActivityId(parsedMessageContent.id);
        // Our test user. In order to clean logs from his invalid actions
        if (userIdFrom === 114 && +err.code === 409) {
          // Conflict transaction ID for too many requests
          ConsumerLogger.info('This is test user conflict transaction. Filter this error');

          // It is not required to terminate consumer for this situation
        } else {
          err.message += ` It is not possible to process message. Message is acked. Raw content is: ${JSON.stringify(message)}. String content is: ${messageContent}`;
          ConsumerLogger.error(err);

          // In order to terminate consumer properly - with error exit code
          throw err;
        }
      } finally {
        channel.ack(message);
      }
    }, {noAck: false});
  }
}

module.exports = BlockchainConsumer;