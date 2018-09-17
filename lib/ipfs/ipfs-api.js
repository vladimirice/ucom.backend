const config = {
  "host": "127.0.0.1",
  "port": "5001",
  "api-path": "/api/v0/"
};

const IpfsLib = require('ipfs-api');
const ipfs = IpfsLib(config);

class IpfsApi {
  static async addFileToIpfs(content) {
    console.log('real ipfs is called');
    return;

    const buffer = Buffer.from(content);

    // noinspection JSUnresolvedFunction
    ipfs.add(buffer)
      .then((data) => {
        console.log(data);
      });
  }

  static async getFileFromIpfs(hash) {
    console.log('real ipfs get is called');

    return;

    // noinspection JSUnresolvedFunction
    ipfs.get(hash).then(data => {

      const buffer = data[0].content;

      console.log(buffer.toString());
      // console.log(Buffer.toString(data[0].content));
    })
  }

}

module.exports = IpfsApi;