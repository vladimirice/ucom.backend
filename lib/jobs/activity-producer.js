const RabbitMqService = require('./rabbitmq-service');

class ActivityProducer {

  static async publishWithContentCreation(message) {
    return await this.publish(message, RabbitMqService.getContentCreationBindingKey());
  }

  // noinspection JSUnusedGlobalSymbols
  static async publishWithContentUpdating(message) {
    return await this.publish(message, RabbitMqService.getContentUpdatingBindingKey());
  }

  static async publishWithUserActivity(message) {
    return await this.publish(message, RabbitMqService.getUserActivityBindingKey());
  }

  static async publish(message, bindingKey) {
    const channel = await RabbitMqService.getChannel();

    const result = await channel.publish(RabbitMqService.getExchangeName(), bindingKey, new Buffer(message));
    // TODO implement separate file for managing queue processes
    // console.log(" [x] Sent %s: '%s'", bindingKey, message);

    return result;
  }
}

module.exports = ActivityProducer;
