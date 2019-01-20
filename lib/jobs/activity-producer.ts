const rabbitMqService = require('./rabbitmq-service');

class ActivityProducer {

  static async publishWithContentCreation(message) {
    return await this.publish(message, rabbitMqService.getContentCreationBindingKey());
  }

  // noinspection JSUnusedGlobalSymbols
  static async publishWithContentUpdating(message) {
    return await this.publish(message, rabbitMqService.getContentUpdatingBindingKey());
  }

  static async publishWithUserActivity(message) {
    return await this.publish(message, rabbitMqService.getUserActivityBindingKey());
  }

  static async publish(message, bindingKey) {
    const channel = await rabbitMqService.getChannel();
    const result = await channel.publish(
      rabbitMqService.getExchangeName(),
      bindingKey,
      new Buffer(message),
    );

    return result;
  }
}

export = ActivityProducer;
