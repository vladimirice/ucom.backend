const RabbitMqService = require('../jobs/rabbitmq-service');
const IpfsService = require('./ipfs-service');

class IpfsConsumer {
  static async consume() {
    const channel = await RabbitMqService.getChannel();
    const message = await this.consumePromise(channel);
    channel.ack(message);

    return await IpfsService.processContent(message.content.toString());
  }

  static async consumePromise(channel) {
    return new Promise(function(resolve, reject) {
      channel.consume(RabbitMqService.getIpfsQueueName(), resolve);
    });
  }
}

module.exports = IpfsConsumer;