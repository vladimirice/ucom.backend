"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const rabbitMqService = require('../../jobs/rabbitmq-service');
const postActivityProcessor = require('../../posts/service/post-activity-processor');
const { ConsumerLogger } = require('../../../config/winston');
class ConsumerTagsParser {
    static consume() {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = yield rabbitMqService.getChannel();
            const queueName = rabbitMqService.getTagsParserQueueName();
            return channel.consume(queueName, (message) => __awaiter(this, void 0, void 0, function* () {
                let messageContent;
                let parsedMessageContent;
                try {
                    messageContent = message.content.toString();
                    parsedMessageContent = JSON.parse(messageContent);
                    // Post processor
                    yield postActivityProcessor.processOneActivity(parsedMessageContent.id);
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
                }
            }), { noAck: false });
        });
    }
}
module.exports = ConsumerTagsParser;
