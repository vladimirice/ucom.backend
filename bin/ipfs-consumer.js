const IpfsConsumer = require('../lib/ipfs/ipfs-consumer');

IpfsConsumer.consume().then(res => {
  console.log(`Ipfs consumer is started. Response is: `, res);
});