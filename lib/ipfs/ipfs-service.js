const IpfsApi = require('./ipfs-api');
const IpfsMetaRepository = require('./ipfs-meta-repository');
const _ = require('lodash');

const IPFS_STATUS__SUCCESS = 1;

class IpfsService {
  static async processContent(content) {
    const originalPost = JSON.parse(content);

    const ipfsResponse = await IpfsApi.addFileToIpfs(content);

    const responseData = ipfsResponse[0];

    let newRecordData = _.pick(responseData, ['hash', 'path']);
    newRecordData['ipfs_size'] = responseData['size'];
    newRecordData['post_id'] = originalPost['id'];
    newRecordData['ipfs_status'] = IPFS_STATUS__SUCCESS;

    const newIpfsMeta = await IpfsMetaRepository.createNew(newRecordData);
    const a = 0;
  }
}

module.exports = IpfsService;