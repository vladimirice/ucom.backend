"use strict";
const RabbitMqService = require("./rabbitmq-service");
class ActivityProducer {
    static async publishWithContentCreation(message) {
        return this.publish(message, RabbitMqService.getContentCreationBindingKey());
    }
    static async publishWithContentUpdating(message) {
        return this.publish(message, RabbitMqService.getContentUpdatingBindingKey());
    }
    static async publishWithUserActivity(message) {
        return this.publish(message, RabbitMqService.getUserActivityBindingKey());
    }
    static async publish(message, bindingKey) {
        const channel = await RabbitMqService.getChannel();
        return channel.publish(RabbitMqService.getExchangeName(), bindingKey, Buffer.from(message));
    }
}
module.exports = ActivityProducer;
