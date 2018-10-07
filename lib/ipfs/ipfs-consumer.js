const RabbitMqService = require('../jobs/rabbitmq-service');
const IpfsService     = require('./ipfs-service');
const winston         = require('../../config/winston');

class IpfsConsumer {
  static async consume() {
    const channel = await RabbitMqService.getChannel();

    console.log('Queue will be: ', RabbitMqService.getIpfsQueueName());

    channel.consume(RabbitMqService.getIpfsQueueName(), async function(message) {
      console.log(" [x] Received %s", message.content.toString());

      try {
        await IpfsService.processContent(message.content.toString());
        channel.ack(message);
      } catch (err) {
        winston.error(err);
        winston.error('It is not possible to process message ' + JSON.stringify(message));
        winston.error('Message content is: ' + message.content.toString());
        channel.ack(message);
      }
    }, {noAck: false});
  }
}

module.exports = IpfsConsumer;