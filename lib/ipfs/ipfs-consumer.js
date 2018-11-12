const RabbitMqService   = require('../jobs/rabbitmq-service');
const IpfsService       = require('./ipfs-service');
const {ConsumerLogger}  = require('../../config/winston');

class IpfsConsumer {
  static async consume() {
    const channel = await RabbitMqService.getChannel();

    channel.consume(RabbitMqService.getIpfsQueueName(), async function(message) {

      try {
        await IpfsService.processContent(message.content.toString());
        channel.ack(message);
      } catch (err) {
        ConsumerLogger.error(`It is not possible to process message: ${JSON.stringify(message)}`);
        ConsumerLogger.error(`Message is acked. Message content is: ${message.content.toString()}`);
        ConsumerLogger.error(err);

        channel.ack(message);
      }
    }, {noAck: false});
  }
}

module.exports = IpfsConsumer;