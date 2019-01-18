const rabbitMqService = require('../../jobs/rabbitmq-service');
const entityNotificationsCreator = require('../../entities/service').NotificationsCreator;
const { ConsumerLogger } = require('../../../config/winston');

class NotificationsConsumer {
  static async consume() {
    const channel = await rabbitMqService.getChannel();
    const queueName = rabbitMqService.getNotificationsQueueName();

    channel.consume(queueName, async (message) => {
      const messageContent = message.content.toString();
      try {
        await entityNotificationsCreator.processJob(JSON.parse(messageContent));
        channel.ack(message);
      } catch (err) {
        // tslint:disable-next-line:max-line-length
        err.message += ` It is not possible to process message ${JSON.stringify(message)}. Message content is: ${messageContent}`;
        ConsumerLogger.error(err);

        channel.ack(message);

        throw err;
      }
    },              { noAck: false });
  }
}

module.exports = NotificationsConsumer;
