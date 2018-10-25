const RabbitMqService = require('../../jobs/rabbitmq-service');
const EntityNotificationsCreator = require('../../entities/service').NotificationsCreator;
const winston = require('../../../config/winston');

class NotificationsConsumer {
  static async consume() {
    const channel = await RabbitMqService.getChannel();
    const queueName = RabbitMqService.getNotificationsQueueName();

    console.log('notifications consumer queue name is: ', queueName);

    channel.consume(queueName, async function(message) {
      const messageContent = message.content.toString();
      console.log(" [x] Received %s", messageContent);
      try {
        await EntityNotificationsCreator.processJob(JSON.parse(messageContent));
        channel.ack(message);
      } catch (err) {
        console.error(err);
        winston.error('It is not possible to process message ' + JSON.stringify(message));
        winston.error('Message content is: ' + messageContent);
        channel.ack(message);

        throw err;
      }
    }, {noAck: false});
  }
}

module.exports = NotificationsConsumer;