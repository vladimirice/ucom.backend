const exchange = 'activity';
const RabbitMqService = require('./rabbitmq-service');

class ActivityProducer {

  static async publishWithContentCreation(message) {
    return await this.publish(message, RabbitMqService.getContentCreationBindingKey());
  }

  static async publish(message, bindingKey) {
    const channel = await RabbitMqService.getChannel();

    await channel.publish(exchange, bindingKey, new Buffer(message));
    // TODO implement separate file for managing queue processes
    console.log(" [x] Sent %s: '%s'", bindingKey, message);

    return true;
  }
}

module.exports = ActivityProducer;
