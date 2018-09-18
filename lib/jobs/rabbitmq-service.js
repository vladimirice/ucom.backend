const rabbitMqConfig = require('config')['rabbitmq'];
const RabbitMqError = require('./rabbitmq-error');

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
  static resetChannelAndConnection() {
    connection = null;
    channel = null;
  }

  static async getChannel() {

    try {
      if (!channel) {
        console.log('lets ask for connection');
        const conn = await this._getConnection();
        console.log('connection is received');
        console.error('lets create new channel...');
        channel = await conn.createChannel();
        console.error('channel is created.')
      } else {
        console.error('Not required to create new channel');
      }

      console.log('lets assert structure');
      await this._assertStructure();

      console.log('structure is asserted');

      return channel;
    } catch (err) {
      this.resetChannelAndConnection();
      throw err;
    }
  }

  static getContentCreationBindingKey() {
    return BINDING_KEY__CONTENT_CREATION;
  }

  static getIpfsQueueName() {
    return rabbitMqConfig['ipfs_queue_name'];
  }
  static getExchangeName() {
    return rabbitMqConfig['activity_exchange_name'];
  }

  static async purgeIpfsQueue() {
    const channel = await this.getChannel();

    await channel.purgeQueue(rabbitMqConfig['ipfs_queue_name']);
  }

  static async _getConnection() {
    try {
      if (!connection) {
        console.error('Lets create new connection...'); //
        connection = await amqplib.connect(rabbitMqConfig['connection_string']);
        console.error('New connection is created');
      } else {
        console.error('It is not required to create new connection');
      }
    } catch (err) { //
      if (err.message.includes('ECONNREFUSED')) {
        throw new RabbitMqError.ConnectionRefusedError('RabbitMq refused to connect');
      }

      throw err;
    }

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