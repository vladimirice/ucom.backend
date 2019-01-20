/* tslint:disable:max-line-length */
const amqplib = require('amqplib');

const rabbitMqConfig = require('config').rabbitmq;
const rabbitMqError = require('./rabbitmq-error');
const { ConsumerLogger } = require('../../config/winston');

const BINDING_KEY__CONTENT_CREATION = 'content-creation';
const BINDING_KEY__CONTENT_UPDATING = 'content-updating';
const BINDING_KEY__USER_ACTIVITY    = 'user-activity';

const blockchainBindingKeys = [
  BINDING_KEY__USER_ACTIVITY,
  BINDING_KEY__CONTENT_CREATION,
];

const notificationsBindingKeys = [
  BINDING_KEY__USER_ACTIVITY,
  BINDING_KEY__CONTENT_CREATION,
];

const tagsBindingKeys = [
  BINDING_KEY__CONTENT_CREATION,
  BINDING_KEY__CONTENT_UPDATING,
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
        await this.assertConnection();
        channel = await connection.createChannel();
        RabbitMqService.setChannelEventHandlers();
        await this.assertStructure();
        channel.qos(1);
      }

      return channel;
    } catch (err) {
      this.resetChannelAndConnection();
      throw err;
    }
  }

  public static async closeAll() {
    if (channel) {
      await channel.close();
      channel = null;
    }

    if (connection) {
      await connection.close();
      connection = null;
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

  /**
   *
   * @returns {string}
   */
  static getTagsParserQueueName() {
    return rabbitMqConfig.tags_parser_queue_name;
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
   * @returns {Promise<void>}
   */
  static async purgeTagsParserQueue() {
    const channel = await this.getChannel();

    await channel.purgeQueue(this.getTagsParserQueueName());
  }

  /**
   *
   * @returns {Promise<void>}
   */
  static async purgeAllQueues() {
    await Promise.all([
      this.purgeBlockchainQueue(),
      this.purgeNotificationsQueue(),
      this.purgeTagsParserQueue(),
    ]);
  }

  /**
   *
   * @private
   */
  private static setConnectionEventHandlers() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    connection.on('error', (err) => {
      ConsumerLogger.error('RabbitMq connection error event. Lets try to reset connection. Error message is: ', err.message);
      RabbitMqService.resetChannelAndConnection();
    });

    connection.on('close', () => {
      ConsumerLogger.error('RabbitMq connection is closed. Lets try to reset connection.');
      RabbitMqService.resetChannelAndConnection();
    });
  }

  /**
   *
   * @private
   */
  private static setChannelEventHandlers() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    channel.on('error', (err) => {
      ConsumerLogger.error('RabbitMq channel error event. Lets try to reset channel and connection. Error message is: ', err.message);
      RabbitMqService.resetChannelAndConnection();
    });

    channel.on('close', () => {
      ConsumerLogger.error('RabbitMq connection is closed. Lets try to reset channel and connection.');
      RabbitMqService.resetChannelAndConnection();
    });
  }

  /**
   *
   * @private
   */
  private static async assertConnection() {
    try {
      if (!connection) {
        connection = await amqplib.connect(rabbitMqConfig.connection_string);
        RabbitMqService.setConnectionEventHandlers();
      }
    } catch (err) {
      if (err.message.includes('ECONNREFUSED')) {
        throw new rabbitMqError.ConnectionRefusedError('RabbitMq refused to connect');
      }

      throw err;
    }
  }

  /**
   *
   * @return {Promise<void>}
   * @private
   */
  private static async assertStructure() {
    const exchangeName            = rabbitMqConfig.activity_exchange_name;
    const blockchainQueueName     = rabbitMqConfig.blockchain_queue_name;
    const notificationsQueueName  = rabbitMqConfig.notifications_queue_name;
    const tagsParserQueueName     = rabbitMqConfig.tags_parser_queue_name;

    await Promise.all([
      channel.assertExchange(exchangeName, 'direct', { durable: true }),

      channel.assertQueue(blockchainQueueName, { durable: true }),
      channel.assertQueue(notificationsQueueName, { durable: true }),
      channel.assertQueue(tagsParserQueueName, { durable: true }),
    ]);

    blockchainBindingKeys.forEach(async (key) => {
      await channel.bindQueue(blockchainQueueName, exchangeName, key);
    });

    notificationsBindingKeys.forEach(async (key) => {
      await channel.bindQueue(notificationsQueueName, exchangeName, key);
    });

    tagsBindingKeys.forEach(async (key) => {
      await channel.bindQueue(tagsParserQueueName, exchangeName, key);
    });
  }

  /**
   *
   * @private
   */
  private static resetChannelAndConnection() {
    connection  = null;
    channel     = null;
  }
}

export = RabbitMqService;
