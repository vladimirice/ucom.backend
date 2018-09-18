global.reqlib = require('app-root-path').require;

const RabbitMqService = require('../jobs/rabbitmq-service');
const IpfsService = require('./ipfs-service');
const winston = require('../../config/winston');

class IpfsConsumer {
  static async consume() {
    const channel = await RabbitMqService.getChannel();

    console.log('Queue will be: ', RabbitMqService.getIpfsQueueName());

    channel.consume(RabbitMqService.getIpfsQueueName(), async function(message) {
      console.log(" [x] Received %s", message.content.toString());

      try {
        await IpfsService.processContent(message.content.toString());
        channel.ack(message);
      } catch (err) {
        winston.error(err);
        winston.error('It is not possible to process message ' + JSON.stringify(message));
        winston.error('Message content is: ' + message.content.toString());
        channel.ack(message);
      }
    }, {noAck: false});

    // let message;
    // try {
    //
    //   await IpfsService.processContent(message.content.toString());
    //   console.log('message is processed');
    //   channel.ack(message);
    // } catch (e) {
    //   channel.nack(message);
    //   console.log(e);
    // }
  }

  static async consumePromise(channel) {
    return new Promise(function(resolve, reject) {
      channel.consume(RabbitMqService.getIpfsQueueName(), resolve);
    });
  }
}

module.exports = IpfsConsumer;