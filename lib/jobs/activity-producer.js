const exchange = 'activity';
const RabbitMqService = require('./rabbitmq-service');

class ActivityProducer {
  static async publish(message, bindingKey) {
    const channel = await RabbitMqService.getChannel();

    await channel.publish(exchange, bindingKey, new Buffer(message));
    console.log(" [x] Sent %s: '%s'", bindingKey, message);
  }
}

module.exports = ActivityProducer;
