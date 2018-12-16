const amqplib = require('amqplib');

const rabbitMqConfig = require('config').rabbitmq;
const RabbitMqError = require('./rabbitmq-error');
const {ConsumerLogger} = require('../../config/winston');

const BINDING_KEY__CONTENT_CREATION = 'content-creation';
const BINDING_KEY__CONTENT_UPDATING = 'content-updating';
const BINDING_KEY__USER_ACTIVITY    = 'user-activity';

// #task Ipfs service is not active now
// const ipfsBindingKeys = [
//   BINDING_KEY__CONTENT_CREATION,
//   BINDING_KEY__CONTENT_UPDATING,
// ];

const blockchainBindingKeys = [
  BINDING_KEY__USER_ACTIVITY,
  BINDING_KEY__CONTENT_CREATION,
];

const notificationsBindingKeys = [
  BINDING_KEY__USER_ACTIVITY,
  BINDING_KEY__CONTENT_CREATION,
];

let connection;
let channel;

class RabbitMqService {
  /**
   *
   * @return {Promise<Object>}
   */
  static async getChannel() {
    try {
      if (!channel) {
        await this._assertConnection();
        channel = await connection.createChannel();
        RabbitMqService._setChannelEventHandlers();
      }
      await this._assertStructure();

      return channel;
    } catch (err) {
      this._resetChannelAndConnection();
      throw err;
    }
  }

  static getContentCreationBindingKey() {
    return BINDING_KEY__CONTENT_CREATION;
  }

  static getContentUpdatingBindingKey() {
    return BINDING_KEY__CONTENT_UPDATING;
  }

  static getUserActivityBindingKey() {
    return BINDING_KEY__USER_ACTIVITY;
  }

  static getIpfsQueueName() {
    return rabbitMqConfig.ipfs_queue_name;
  }

  static getBlockchainQueueName() {
    return rabbitMqConfig.blockchain_queue_name;
  }

  static getNotificationsQueueName() {
    return rabbitMqConfig.notifications_queue_name;
  }

  static getExchangeName() {
    return rabbitMqConfig.activity_exchange_name;
  }

  static async purgeIpfsQueue() {
    const channel = await this.getChannel();

    await channel.purgeQueue(rabbitMqConfig.ipfs_queue_name);
  }

  static async purgeBlockchainQueue() {
    const channel = await this.getChannel();

    await channel.purgeQueue(this.getBlockchainQueueName());
  }

  static async purgeNotificationsQueue() {
    const channel = await this.getChannel();

    await channel.purgeQueue(this.getNotificationsQueueName());
  }

  /**
   *
   * @private
   */
  static _setConnectionEventHandlers() {
    connection.on("error", function(err) {
      ConsumerLogger.error('RabbitMq connection error event. Lets try to reset connection. Error message is: ', err.message);
      RabbitMqService._resetChannelAndConnection();
    });

    connection.on("close", function() {
      if (process.env.NODE_ENV !== 'test') {
        ConsumerLogger.error('RabbitMq connection is closed. Lets try to reset connection.');
        RabbitMqService._resetChannelAndConnection();
      }
    });
  }

  /**
   *
   * @private
   */
  static _setChannelEventHandlers() {
    channel.on("error", function(err) {
      ConsumerLogger.error('RabbitMq channel error event. Lets try to reset channel and connection. Error message is: ', err.message);
      RabbitMqService._resetChannelAndConnection();
    });

    channel.on("close", function() {
      ConsumerLogger.error('RabbitMq connection is closed. Lets try to reset channel and connection.');
      RabbitMqService._resetChannelAndConnection();
    });
  }

  /**
   *
   * @private
   */
  static async _assertConnection() {
    try {
      if (!connection) {
        connection = await amqplib.connect(rabbitMqConfig.connection_string);
        RabbitMqService._setConnectionEventHandlers();
      }
    } catch (err) {
      if (err.message.includes('ECONNREFUSED')) {
        throw new RabbitMqError.ConnectionRefusedError('RabbitMq refused to connect');
      }

      throw err;
    }
  }

  /**
   *
   * @return {Promise<void>}
   * @private
   */
  static async _assertStructure() {
    const exchangeName            = rabbitMqConfig.activity_exchange_name;
    const ipfsQueueName           = rabbitMqConfig.ipfs_queue_name;
    const blockchainQueueName     = rabbitMqConfig.blockchain_queue_name;
    const notificationsQueueName  = rabbitMqConfig.notifications_queue_name;

    await Promise.all([
      channel.assertExchange(exchangeName, 'direct', {durable: true}),
      channel.assertQueue(ipfsQueueName),
      channel.assertQueue(blockchainQueueName),
      channel.assertQueue(notificationsQueueName)
    ]);

    // #task Ipfs service is not active now
    // ipfsBindingKeys.forEach(async (key) => {
    //   await channel.bindQueue(ipfsQueueName, exchangeName, key);
    // });

    blockchainBindingKeys.forEach(async (key) => {
      await channel.bindQueue(blockchainQueueName, exchangeName, key);
    });

    notificationsBindingKeys.forEach(async (key) => {
      await channel.bindQueue(notificationsQueueName, exchangeName, key);
    });
  }

  /**
   *
   * @private
   */
  static _resetChannelAndConnection() {
    connection  = null;
    channel     = null;
  }
}

module.exports = RabbitMqService;