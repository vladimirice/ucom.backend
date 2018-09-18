const IpfsConsumer = require('../lib/ipfs/ipfs-consumer');

IpfsConsumer.consume().then(res => {
  console.log(res);
});