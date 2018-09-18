const rabbitMqConfig = require('config')['rabbitmq'];

const BINDING_KEY__CONTENT_CREATION = 'content-creation';
const BINDING_KEY__CONTENT_UPDATING = 'content-updating';

const bindingKeys = [
  BINDING_KEY__CONTENT_CREATION,
  BINDING_KEY__CONTENT_UPDATING
];

const amqplib = require('amqplib');

let connection;
let channel;

class RabbitMqService {
  static async getChannel() {
    if (!channel) {
      const conn = await this._getConnection();
      channel = await conn.createChannel();
    }

    await this._assertStructure();

    // TODO on error reconnect

    return channel;
  }

  static getContentCreationBindingKey() {
    return BINDING_KEY__CONTENT_CREATION;
  }

  static getIpfsQueueName() {
    return rabbitMqConfig['ipfs_queue_name'];
  }

  static async purgeIpfsQueue() {
    const channel = await this.getChannel();

    await channel.deleteQueue(rabbitMqConfig['ipfs_queue_name']);
  }

  static async _getConnection() {
    if (!connection) {
      connection = amqplib.connect(rabbitMqConfig['connection_string']);
    }

    // TODO on error reconnect

    return connection;
  }

  static async _assertStructure() {
    const exchangeName = rabbitMqConfig['activity_exchange_name'];
    const queueName = rabbitMqConfig['ipfs_queue_name'];

    await Promise.all([
      channel.assertExchange(exchangeName, 'direct', {durable: true}),
      channel.assertQueue(queueName)
    ]);

    bindingKeys.forEach(async (key) => {
      await channel.bindQueue(queueName, exchangeName, key);
    });
  }
}

module.exports = RabbitMqService;