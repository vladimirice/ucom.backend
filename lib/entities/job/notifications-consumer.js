const RabbitMqService = require('../../jobs/rabbitmq-service');
const EntityNotificationsCreator = require('../../entities/service').NotificationsCreator;
const { ConsumerLogger } = require('../../../config/winston');

class NotificationsConsumer {
  static async consume() {
    const channel = await RabbitMqService.getChannel();
    const queueName = RabbitMqService.getNotificationsQueueName();

    channel.consume(queueName, async function(message) {
      const messageContent = message.content.toString();
      try {
        await EntityNotificationsCreator.processJob(JSON.parse(messageContent));
        channel.ack(message);
      } catch (err) {
        err.message += ` It is not possible to process message ${JSON.stringify(message)}. Message content is: ${messageContent}`;
        ConsumerLogger.error(err);

        channel.ack(message);

        throw err;
      }
    }, {noAck: false});
  }
}

module.exports = NotificationsConsumer;