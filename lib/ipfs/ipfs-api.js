const config = require('config')['ipfs'];

const IpfsLib = require('ipfs-api');
const ipfs = IpfsLib(config);

class IpfsApi {
  static async addFileToIpfs(content) {
    const buffer = Buffer.from(content);

    return await ipfs.add(buffer);
  }

  static async getFileFromIpfs(hash) {
    // noinspection JSUnresolvedFunction
    ipfs.get(hash).then(data => {

      const buffer = data[0].content;

      console.log(buffer.toString());
      // console.log(Buffer.toString(data[0].content));
    })
  }

}

module.exports = IpfsApi;