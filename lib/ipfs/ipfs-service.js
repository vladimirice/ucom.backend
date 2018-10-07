const IpfsApi = require('./ipfs-api');
const IpfsMetaRepository = require('./ipfs-meta-repository');
const PostJobSerializer = require('../posts/post-job-serializer');
const _ = require('lodash');

const IPFS_STATUS__SUCCESS = 1;

class IpfsService {
  static async process(message) {
    if (!message.id) {
      throw new Error(`Malformed message. ID is required. Message is: ${JSON.stringify(message)}`);
    }

    const signedTransaction = await UserActivitySerializer.getActivityDataToPushToBlockchain(message);
    const blockchainResponse = await TransactionSender.pushTransaction(signedTransaction.transaction);

    if (message.scope === 'activity_user_user') {
      await UserRepository.ActivityUserUser.setIsSentToBlockchainAndResponse(
        message.id,
        JSON.stringify(blockchainResponse)
      );
    } else {
      await UserRepository.Activity.setIsSentToBlockchainAndResponse(
        message.id,
        JSON.stringify(blockchainResponse)
      );
    }
  }


  static async processContent(message) {
    const parsedMessage = JSON.parse(message);
    console.log('Message is parsed', JSON.stringify(parsedMessage, null, 2));

    const originalContent = await PostJobSerializer.getPostDataForIpfs(parsedMessage);

    console.log('Original content is: ', JSON.stringify(originalContent, null, 2));

    const ipfsResponse = await IpfsApi.addFileToIpfs(JSON.stringify(originalContent));
    // console.log('ipfs response is received');

    const responseData = ipfsResponse[0];

    let newRecordData = _.pick(responseData, ['hash', 'path']);
    newRecordData['ipfs_size'] = responseData['size'];
    newRecordData['post_id'] = originalContent['id'];
    newRecordData['ipfs_status'] = IPFS_STATUS__SUCCESS;

    console.warn('New record to write: ', JSON.stringify(newRecordData, null, 2));

    const newIpfsMeta = await IpfsMetaRepository.createNew(newRecordData);
    // console.log(JSON.stringify(newIpfsMeta), null, 2);
  }
}

module.exports = IpfsService;