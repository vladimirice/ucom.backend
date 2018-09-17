const RabbitMqService = require('../jobs/rabbitmq-service');

class IpfsConsumer {
  static async consume() {
    const channel = await RabbitMqService.getChannel();

    await channel.consume(RabbitMqService.getIpfsQueueName(), function(message) {
      console.log(" [x] %s: '%s'", message.fields.routingKey, message.content.toString());



      // TODO do something related to IPFS

      channel.ack(message);

    }, {noAck: false});
  }
}

module.exports = IpfsConsumer;