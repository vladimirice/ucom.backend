"use strict";
/* eslint-disable no-console */
const rabbitMqService = require('../../jobs/rabbitmq-service');
const postActivityProcessor = require('../../posts/service/post-activity-processor');
const commentsActivityProcessor = require('../../comments/service/comments-activity-processor');
const { ConsumerLogger } = require('../../../config/winston');
class ConsumerTagsParser {
    static async consume() {
        const channel = await rabbitMqService.getChannel();
        const queueName = rabbitMqService.getTagsParserQueueName();
        return channel.consume(queueName, async (message) => {
            let messageContent;
            let parsedMessageContent;
            try {
                messageContent = message.content.toString();
                parsedMessageContent = JSON.parse(messageContent);
                const processedAsPost = await postActivityProcessor.processOneActivity(parsedMessageContent.id);
                if (!processedAsPost) {
                    await commentsActivityProcessor.processOneActivity(parsedMessageContent.id);
                    console.log('processed as comment');
                }
                console.log('end of block');
            }
            catch (err) {
                // Our test user. In order to clean logs from his invalid actions
                err.message +=
                    ` It is not possible to process message. Message is acked.
          Raw content is: ${JSON.stringify(message)}.
          String content is: ${messageContent}`;
                ConsumerLogger.error(err);
                // In order to terminate consumer properly - with error exit code
                throw err;
            }
            finally {
                channel.ack(message);
                console.log('acked!');
            }
        }, { noAck: false });
    }
}
module.exports = ConsumerTagsParser;
