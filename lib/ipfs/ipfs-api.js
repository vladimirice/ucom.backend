const config = require('config')['ipfs'];

const IpfsLib = require('ipfs-api');
const ipfs = IpfsLib(config);

class IpfsApi {
  static async addFileToIpfs(content) {
    if (process.env.NODE_ENV === 'test') {
      console.log('Fake response is returned due to tests');
      return [
        {
          path: 'QmZY43MX85ThZwJjD6kDrkzTdVyQjDh52phh2MgWZDQoJ7',
          hash: 'QmZY43MX85ThZwJjD6kDrkzTdVyQjDh52phh2MgWZDQoJ7',
          size: 39
        }
      ];
    }

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