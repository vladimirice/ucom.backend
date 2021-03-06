/* eslint-disable no-console */
const rabbitMqService = require('../../jobs/rabbitmq-service');
const blockchainJobProcessor = require('./blockchain-job-processor');
const { ConsumerLogger } = require('../../../config/winston');

const usersActivityRepository = require('../../users/repository').Activity;

class BlockchainConsumer {
  static async consume() {
    const channel = await rabbitMqService.getChannel();
    const queueName = rabbitMqService.getBlockchainQueueName();

    channel.consume(queueName, async (message) => {
      let messageContent;
      let parsedMessageContent;

      try {
        messageContent        = message.content.toString();
        parsedMessageContent  = JSON.parse(messageContent);

        console.log(`Consumed message: ${messageContent}`);

        await blockchainJobProcessor.process(parsedMessageContent);
      } catch (error) {
        const userIdFrom =
          await usersActivityRepository.getUserIdFromByActivityId(parsedMessageContent.id);
        // Our test user. In order to clean logs from his invalid actions
        if (userIdFrom === 114 && +error.code === 409) {
          // Conflict transaction ID for too many requests
          ConsumerLogger.info('This is test user conflict transaction. Filter this error');

          // It is not required to terminate consumer for this situation
        } else {
          // tslint:disable-next-line
          error.message += ` It is not possible to process message. Message is acked. Raw content is: ${JSON.stringify(message)}. String content is: ${messageContent}`;
          ConsumerLogger.error(error);

          // In order to terminate consumer properly - with error exit code
          throw error;
        }
      } finally {
        channel.ack(message);
      }
    },              { noAck: false });
  }
}

export = BlockchainConsumer;
