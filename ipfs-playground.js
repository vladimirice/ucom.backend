// jscs:disable

const postContentAsHtml = '<p>hello from post content </p>';

const config = {
    "host": "127.0.0.1",
    "port": "5001",
    "api-path": "/api/v0/"
};

const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI(config);

class IpfsPlayground {
  static async addFileToIpfs() {
    const buffer = Buffer.from(postContentAsHtml);

    // noinspection JSUnresolvedFunction
    ipfs.add(buffer)
      .then((data) => {
        console.log(data);


      });
  }

  static async getFileFromIpfs() {
    ipfs.get('QmZY43MX85ThZwJjD6kDrkzTdVyQjDh52phh2MgWZDQoJ7').then(data => {

      const buffer = data[0].content;

      console.log(buffer.toString());
      // console.log(Buffer.toString(data[0].content));
    })
  }
}

/*
[ { path: 'QmZY43MX85ThZwJjD6kDrkzTdVyQjDh52phh2MgWZDQoJ7',
    hash: 'QmZY43MX85ThZwJjD6kDrkzTdVyQjDh52phh2MgWZDQoJ7',
    size: 39 } ]

 */

IpfsPlayground.addFileToIpfs();
