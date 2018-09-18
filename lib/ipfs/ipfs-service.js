const IpfsApi = require('./ipfs-api');
const IpfsMetaRepository = require('./ipfs-meta-repository');
const _ = require('lodash');

const IPFS_STATUS__SUCCESS = 1;

class IpfsService {
  static async processContent(content) {
    const originalPost = JSON.parse(content);
    console.log('Post is parsed');

    const ipfsResponse = await IpfsApi.addFileToIpfs(content);
    console.log('ipfs response is received');

    const responseData = ipfsResponse[0];

    let newRecordData = _.pick(responseData, ['hash', 'path']);
    newRecordData['ipfs_size'] = responseData['size'];
    newRecordData['post_id'] = originalPost['id'];
    newRecordData['ipfs_status'] = IPFS_STATUS__SUCCESS;

    const newIpfsMeta = await IpfsMetaRepository.createNew(newRecordData);
    console.log(JSON.stringify(newIpfsMeta), null, 2);
  }
}

module.exports = IpfsService;