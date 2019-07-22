import RabbitMqService = require('./rabbitmq-service');

class ActivityProducer {
  public static async publishWithContentCreation(message) {
    return this.publish(message, RabbitMqService.getContentCreationBindingKey());
  }

  public static async publishWithContentUpdating(message) {
    return this.publish(message, RabbitMqService.getContentUpdatingBindingKey());
  }

  public static async publishWithUserActivity(message) {
    return this.publish(message, RabbitMqService.getUserActivityBindingKey());
  }

  private static async publish(message, bindingKey) {
    const channel = await RabbitMqService.getChannel();
    return channel.publish(
      RabbitMqService.getExchangeName(),
      bindingKey,
      Buffer.from(message),
    );
  }
}

export = ActivityProducer;
