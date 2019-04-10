/* eslint-disable no-console */
import EntityNotificationsCreator = require('../service/entity-notifications-creator');

const rabbitMqService = require('../../jobs/rabbitmq-service');
const { ConsumerLogger } = require('../../../config/winston');

class NotificationsConsumer {
  static async consume() {
    const channel = await rabbitMqService.getChannel();
    const queueName = rabbitMqService.getNotificationsQueueName();

    return channel.consume(queueName, async (message) => {
      const messageContent = message.content.toString();

      console.log(`Message content: ${messageContent}`);
      try {
        await EntityNotificationsCreator.processJob(JSON.parse(messageContent));

        console.log('Processed');
        channel.ack(message);
      } catch (err) {
        err.message += ` It is not possible to process message ${JSON.stringify(message)}. Message content is: ${messageContent}`;
        ConsumerLogger.error(err);

        channel.ack(message);

        throw err;
      }
    },              { noAck: false });
  }
}

export = NotificationsConsumer;
