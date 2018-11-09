const IpfsApi = require('./ipfs-api');
const IpfsMetaRepository = require('./ipfs-meta-repository');
const PostJobSerializer = require('../posts/post-job-serializer');
const _ = require('lodash');

const IPFS_STATUS__SUCCESS = 1;

class IpfsService {

  /**
   *
   * @param {string} message
   * @return {Promise<void>}
   */
  static async processContent(message) {
    const parsedMessage = JSON.parse(message);

    const originalContent = await PostJobSerializer.getPostDataForIpfs(parsedMessage);


    const ipfsResponse = await IpfsApi.addFileToIpfs(JSON.stringify(originalContent));
    // console.log('ipfs response is received');

    const responseData = ipfsResponse[0];

    let newRecordData = _.pick(responseData, ['hash', 'path']);
    newRecordData['ipfs_size'] = responseData['size'];
    newRecordData['post_id'] = originalContent['id'];
    newRecordData['ipfs_status'] = IPFS_STATUS__SUCCESS;


    await IpfsMetaRepository.createNew(newRecordData);
  }
}

module.exports = IpfsService;