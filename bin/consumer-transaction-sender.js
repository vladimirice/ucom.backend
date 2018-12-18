const Consumer = require('../lib/eos/job/blockchain-consumer');

Consumer.consume().then(res => {
  console.log(`Blockchain consumer is started. Response from start is ${res}`);
}).catch(() => {
  console.error('An error is occured. See logs');
  process.exit(1);
});